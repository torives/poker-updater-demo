// Copyright 2021 Cartesi Pte. Ltd.

// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

/// @title TurnBasedGameLobby
/// @author Milton Jonathan
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TurnBasedGame.sol";

/// @title TurnBasedGameLobby
/// @notice Entry point for players to join games handled by the TurnBasedGame contract
contract TurnBasedGameLobby {
    // TurnBasedGame contract used for starting games
    TurnBasedGame turnBasedGame;

    // records queue information
    struct QueuedPlayer {
        address addr;
        uint256 funds;
        bytes info;
    }
    mapping(bytes32 => QueuedPlayer[]) internal queues;

    /// @notice Constructor
    /// @param turnBasedGameAddress address of the TurnBasedGame contract used for starting games
    constructor(address turnBasedGameAddress) {
        turnBasedGame = TurnBasedGame(turnBasedGameAddress);
    }

    /// @notice Retrieves the current queue for a given game (specified by its template hash, metadata and number of players)
    /// @param _gameTemplateHash template hash for the Cartesi Machine computation that verifies the game (identifies the game computation/logic)
    /// @param _gameMetadata game-specific initial metadata/parameters
    /// @param _gameValidators addresses of the validator nodes that will run a Descartes verification should it be needed
    /// @param _gameNumPlayers number of players in the game
    /// @param _gameMinFunds minimum funds required to be staked in order to join the game
    /// @return array of QueuedPlayer structs representing the currently enqueued players for the specified game
    function getQueue(
        bytes32 _gameTemplateHash,
        bytes memory _gameMetadata,
        address[] memory _gameValidators,
        uint8 _gameNumPlayers,
        uint256 _gameMinFunds
    ) public view returns (QueuedPlayer[] memory) {
        // builds hash for game specification
        bytes32 queueHash =
            keccak256(
                abi.encodePacked(_gameTemplateHash, _gameMetadata, _gameValidators, _gameNumPlayers, _gameMinFunds)
            );
        // retrieves queued players for given game specification
        return queues[queueHash];
    }

    /// @notice Allows a player to join a game. People are queued up as they join and the game starts when enough people are available.
    /// @param _gameTemplateHash template hash for the Cartesi Machine computation that verifies the game (identifies the game computation/logic)
    /// @param _gameMetadata game-specific initial metadata/parameters
    /// @param _gameValidators addresses of the validator nodes that will run a Descartes verification should it be needed
    /// @param _gameNumPlayers number of players in the game
    /// @param _gameMinFunds minimum funds required to be staked in order to join the game
    /// @param _playerFunds amount being staked by the player joining the game
    /// @param _erc20ProviderAddress Address for a ERC20 compatible token provider
    /// @param _playerInfo game-specific information for the player joining the game
    function joinGame(
        bytes32 _gameTemplateHash,
        bytes memory _gameMetadata,
        address[] memory _gameValidators,
        uint8 _gameNumPlayers,
        uint256 _gameMinFunds,
        uint256 _playerFunds,
        address _erc20ProviderAddress,
        bytes memory _playerInfo
    ) public {
        // ensures player is staking enough funds to participate in the game
        require(_playerFunds >= _gameMinFunds, "Player's staked funds is insufficient to join the game");

        // builds hash for game specification
        bytes32 queueHash =
            keccak256(
                abi.encodePacked(_gameTemplateHash, _gameMetadata, _gameValidators, _gameNumPlayers, _gameMinFunds)
            );

        // retrieves queued players for given game specification
        QueuedPlayer[] storage queuedPlayers = queues[queueHash];

        // reverts if player is already in the queue
        for (uint256 i = 0; i < queuedPlayers.length; i++) {
            require(queuedPlayers[i].addr != msg.sender, "Player has already been enqueued to join this game");
        }

        // Token locking
        lockFunds(IERC20(_erc20ProviderAddress), msg.sender, _gameMinFunds);

        if (queuedPlayers.length < _gameNumPlayers - 1) {
            // not enough players queued yet, so we simply add this new one to the queue
            QueuedPlayer memory newPlayer;
            newPlayer.addr = msg.sender;
            newPlayer.funds = _playerFunds;
            newPlayer.info = _playerInfo;
            queuedPlayers.push(newPlayer);
        } else {
            // enough players are already queued: we can start a game
            // - collects previously queued players
            address[] memory players = new address[](_gameNumPlayers);
            uint256[] memory playerFunds = new uint256[](_gameNumPlayers);
            bytes[] memory playerInfos = new bytes[](_gameNumPlayers);
            for (uint256 i = 0; i < _gameNumPlayers - 1; i++) {
                players[i] = queuedPlayers[i].addr;
                playerFunds[i] = queuedPlayers[i].funds;
                playerInfos[i] = queuedPlayers[i].info;
            }

            // - adds new player
            players[_gameNumPlayers - 1] = msg.sender;
            playerFunds[_gameNumPlayers - 1] = _playerFunds;
            playerInfos[_gameNumPlayers - 1] = _playerInfo;

            //Tranfer tokens to game contract
            uint256 tokensLocked = _gameNumPlayers * _gameMinFunds;
            transferTokensToGameAccount(IERC20(_erc20ProviderAddress), tokensLocked);

            // - starts game
            turnBasedGame.startGame(
                _gameTemplateHash,
                _gameMetadata,
                _gameValidators,
                players,
                playerFunds,
                playerInfos
            );
            // clears up queue
            delete queues[queueHash];
        }
    }

    /// @notice Lock player tokens in the lobby contract until the game start
    /// @param _tokenProvider ERC20 compatible token provider instance
    /// @param _playerAddress address for the player whose tokens will be locked in lobby account
    /// @param _gameMinFunds minimum funds required to be staked in order to join the game
    function lockFunds(
        IERC20 _tokenProvider,
        address _playerAddress,
        uint256 _gameMinFunds
    ) public {
        _tokenProvider.transferFrom(_playerAddress, address(this), _gameMinFunds);
    }

    /// @notice Transfer players tokens locked in lobby contract to the game contract
    /// @param _tokenProvider ERC20 compatible token provider instance
    /// @param _tokensToTransfer Amount of tokens locked in lobby contract that will be transfered to game contract
    function transferTokensToGameAccount(IERC20 _tokenProvider, uint256 _tokensToTransfer) public {
        _tokenProvider.transfer(address(turnBasedGame), _tokensToTransfer);
    }
}
