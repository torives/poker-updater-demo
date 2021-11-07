#!/bin/bash

# metadata (empty)
truncate -s 4K metadata.raw

# players: 2 players, addresses, funds (100/100)
echo "00000002000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb9226600000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c800000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000064" | xxd -r -p > players.raw
truncate -s 4K players.raw

# turnsMetadata: 2 turns, player addresses, nextPlayer addresses, player stakes (10/10), timestamps (2021-06-04T13:22:24Z and 2021-06-04T13:22:44Z), sizes (4K/4K)
echo "00000002f39fd6e51aad88f6f4ce6ab8827279cfffb9226670997970c51812dc3a010c7d01b50e0d17dc79c870997970c51812dc3a010c7d01b50e0d17dc79c8f39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000a60ba291060ba29240000100000001000" | xxd -r -p > turnsMetadata.raw
truncate -s 64K turnsMetadata.raw

# turnsData: 2 turns: "b3", "g5"
echo -n "b3" > turnData1.raw
echo -n "g5" > turnData2.raw
truncate -s 4K turnData1.raw
truncate -s 4K turnData2.raw
cat turnData1.raw turnData2.raw > turnsData.raw
truncate -s 1M turnsData.raw

# verificationInfo: challenger, challengeTimestamp (2021-06-04T13:23:01Z), claimer, claimTimestamp (2021-06-04T13:22:55Z), claimedResult (120/80)
echo "70997970c51812dc3a010c7d01b50e0d17dc79c860ba2935f39fd6e51aad88f6f4ce6ab8827279cfffb9226660ba292f00000000000000000000000000000000000000000000000000000000000000780000000000000000000000000000000000000000000000000000000000000050" | xxd -r -p > verificationInfo.raw

# verificationInfo: challenger, challengeTimestamp (2021-06-04T13:23:01Z) only
# echo "f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000000000000000000000000000000000000060ba2935" | xxd -r -p > verificationInfo.raw
# echo "70997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000000000060ba2935" | xxd -r -p > verificationInfo.raw
truncate -s 4K verificationInfo.raw

# output (empty)
truncate -s 4K output.raw

