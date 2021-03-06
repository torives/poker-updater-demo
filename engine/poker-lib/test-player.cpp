#include <iostream>
#include <sstream>
#include "poker-lib.h"
#include "player.h"
#include "game-playback.h"
#include "test-util.h"
#include "poker-lib.h"

using namespace poker;
using namespace poker::cards;

#define TEST_SUITE_NAME "Test player"

#define FLOP(n) (n)
#define TURN    FLOP(2)+1
#define RIVER   FLOP(2)+2

void test_the_happy_path() {
    player alice(ALICE);
    assert_eql(SUCCESS, alice.init(100, 300, 10));
    assert_eql(-1, alice.winner());
    assert_eql(100, alice.game().players[ALICE].total_funds);
    assert_eql(5, alice.game().players[ALICE].bets);
    assert_eql(300, alice.game().players[BOB].total_funds);
    assert_eql(10, alice.game().players[BOB].bets);
    assert_eql(0, alice.game().funds_share[ALICE]);
    assert_eql(0, alice.game().funds_share[BOB]);
    assert_eql(uk, alice.private_card(0));
    assert_eql(uk, alice.private_card(1));
    assert_eql(uk, alice.opponent_card(0));
    assert_eql(uk, alice.opponent_card(1));
    assert_eql(uk, alice.public_card(FLOP(0)));
    assert_eql(uk, alice.public_card(FLOP(1)));
    assert_eql(uk, alice.public_card(FLOP(2)));
    assert_eql(uk, alice.public_card(TURN));
    assert_eql(uk, alice.public_card(RIVER));

    player bob(BOB);
    assert_eql(SUCCESS, bob.init(100, 300, 10));
    assert_eql(-1, bob.winner());
    assert_eql(100, bob.game().players[ALICE].total_funds);
    assert_eql(5, bob.game().players[ALICE].bets);
    assert_eql(300, bob.game().players[BOB].total_funds);
    assert_eql(10, bob.game().players[BOB].bets);
    assert_eql(0, bob.game().funds_share[ALICE]);
    assert_eql(0, bob.game().funds_share[BOB]);

    assert_eql(uk, bob.private_card(0));
    assert_eql(uk, bob.private_card(1));
    assert_eql(uk, bob.opponent_card(0));
    assert_eql(uk, bob.opponent_card(1));
    assert_eql(uk, bob.public_card(FLOP(0)));
    assert_eql(uk, bob.public_card(FLOP(1)));
    assert_eql(uk, bob.public_card(FLOP(2)));
    assert_eql(uk, bob.public_card(TURN));
    assert_eql(uk, bob.public_card(RIVER));

    std::map<int, std::string> msg; // messages exchanged during game

    // Start handshake
    assert_eql(SUCCESS, alice.create_handshake(msg[0]));
    assert_eql(CONTINUED, bob.process_handshake(msg[0], msg[1]));
    assert_eql(CONTINUED, alice.process_handshake(msg[1], msg[2]));
    assert_eql(CONTINUED, bob.process_handshake(msg[2], msg[3]));
    assert_eql(SUCCESS, alice.process_handshake(msg[3], msg[4]));
    assert_eql(SUCCESS, bob.process_handshake(msg[4], msg[5]));
    assert_eql(true, msg[5].size()==0);
    // Handhsake finished
    assert_neq(uk, alice.private_card(0));
    assert_neq(uk, alice.private_card(1));
    assert_neq(uk, bob.private_card(0));
    assert_neq(uk, bob.private_card(1));

    // Start betting rounds
    assert_eql(ALICE, alice.current_player());
    assert_eql(ALICE, bob.current_player());
    assert_eql(game_step::PREFLOP_BET, alice.step());
    assert_eql(game_step::PREFLOP_BET, bob.step());

    // Preflop: Alice calls
    assert_eql(SUCCESS, alice.create_bet(BET_CALL, 0, msg[5]));
    assert_eql(game_step::PREFLOP_BET, alice.step());
    assert_eql(BOB, alice.current_player());
    assert_eql(SUCCESS, bob.process_bet(msg[5], msg[6]));
    assert_eql(true, msg[6].empty());
    assert_eql(game_step::PREFLOP_BET, bob.step());
    assert_eql(BOB, bob.current_player());

    // Preflop: Bob checks
    assert_eql(CONTINUED, bob.create_bet(BET_CHECK, 0, msg[6]));
    assert_eql(game_step::OPEN_FLOP, bob.step());
    assert_eql(BOB, bob.current_player());
    assert_eql(SUCCESS, alice.process_bet(msg[6], msg[7]));
    assert_neq(uk, alice.public_card(FLOP(0)));
    assert_neq(uk, alice.public_card(FLOP(1)));
    assert_neq(uk, alice.public_card(FLOP(2)));
    assert_eql(SUCCESS, bob.process_bet(msg[7], msg[8]));
    assert_eql(true, msg[8].empty());

    assert_eql(BOB, bob.current_player());
    assert_neq(uk, bob.public_card(FLOP(0)));
    assert_neq(uk, bob.public_card(FLOP(1)));
    assert_neq(uk, bob.public_card(FLOP(2)));

    bet_type type;
    money_t amt;

    // Flop: Bob checks
    assert_eql(game_step::FLOP_BET, bob.step());
    assert_eql(SUCCESS, bob.create_bet(BET_CHECK, 0, msg[8]));
    assert_eql(ALICE, bob.current_player());
    assert_eql(game_step::FLOP_BET, alice.step());
    assert_eql(SUCCESS, alice.process_bet(msg[8], msg[9]));
    assert_eql(true, msg[9].size()==0);
    assert_eql(ALICE, alice.current_player());

    // Flop: Alice checks
    assert_eql(game_step::FLOP_BET, alice.step());
    assert_eql(CONTINUED, alice.create_bet(BET_CHECK, 0, msg[9]));
    assert_eql(SUCCESS, bob.process_bet(msg[9], msg[10]));
    assert_eql(SUCCESS, alice.process_bet(msg[10], msg[11]));
    assert_eql(true, msg[11].size()==0);
    assert_eql(BOB, alice.current_player());
    assert_eql(BOB, bob.current_player());
    assert_neq(uk, bob.public_card(TURN));
    assert_neq(uk, alice.public_card(TURN));

    // Turn: Bob raises
    assert_eql(game_step::TURN_BET, bob.step());
    assert_eql(game_step::TURN_BET, alice.step());
    assert_eql(SUCCESS, bob.create_bet(BET_RAISE, 30, msg[11]));
    assert_eql(40, bob.game().players[BOB].bets);

    assert_eql(SUCCESS, alice.process_bet(msg[11], msg[12], &type, &amt));
    assert_eql(40, alice.game().players[BOB].bets);

    assert_eql(BET_RAISE, type);
    assert_eql(30, amt);
    assert_eql(true, msg[12].size()==0);
    assert_eql(ALICE, alice.current_player());
    assert_eql(ALICE, bob.current_player());

    // Alice calls
    assert_eql(game_step::TURN_BET, alice.step());
    assert_eql(CONTINUED, alice.create_bet(BET_CALL, 0, msg[12]));
    assert_eql(40, alice.game().players[ALICE].bets);
    assert_eql(game_step::OPEN_RIVER, alice.step());
    assert_eql(SUCCESS, bob.process_bet(msg[12], msg[13]));
    assert_eql(40, bob.game().players[ALICE].bets);
    assert_eql(SUCCESS, alice.process_bet(msg[13], msg[14]));
    assert_eql(true, msg[14].empty());

    assert_eql(game_step::RIVER_BET, alice.step());
    assert_eql(game_step::RIVER_BET, bob.step());
    assert_eql(BOB, alice.current_player());
    assert_eql(BOB, bob.current_player());
    assert_neq(uk, bob.public_card(RIVER));
    assert_neq(uk, alice.public_card(RIVER));

    // Bob checks
    assert_eql(SUCCESS, bob.create_bet(BET_CHECK, 0, msg[14]));
    assert_eql(SUCCESS, alice.process_bet(msg[14], msg[15], &type, &amt));
    assert_eql(true, msg[15].empty());

    // Alice checks
    assert_eql(CONTINUED, alice.create_bet(BET_CHECK, 0, msg[15]));
    assert_eql(game_step::SHOWDOWN, alice.step());
    assert_eql(CONTINUED, bob.process_bet(msg[15], msg[16], &type, &amt));
    assert_eql(game_step::SHOWDOWN, bob.step());
    assert_eql(SUCCESS, alice.process_bet(msg[16], msg[17], &type, &amt));
    assert_eql(game_step::GAME_OVER, alice.step());
    assert_eql(SUCCESS, bob.process_bet(msg[17], msg[18], &type, &amt));
    assert_eql(game_step::GAME_OVER, bob.step());
    assert_eql(true, msg[18].size()==0);

    assert_neq(uk, alice.opponent_card(0));
    assert_neq(uk, alice.opponent_card(1));

    assert_neq(-1, alice.winner());
    assert_neq(-1, bob.winner());
    assert_eql(alice.winner(), bob.winner());

    assert_neq(0, alice.game().funds_share[ALICE]);
    assert_neq(0, alice.game().funds_share[BOB]);
    assert_eql(alice.game().funds_share[ALICE], bob.game().funds_share[ALICE]);
    assert_eql(alice.game().funds_share[BOB], bob.game().funds_share[BOB]);

    if(alice.winner() == ALICE) {
        std::cout << "-----> 1 \n";
        assert_neq(uk, bob.opponent_card(0));
        assert_neq(uk, bob.opponent_card(1));
    } else { //Alice mucks
        std::cout << "-----> 2 \n";
        assert_eql(uk, bob.opponent_card(0));
        assert_eql(uk, bob.opponent_card(1));
    }
}

void test_fold() {
    player alice(ALICE);
    assert_eql(SUCCESS, alice.init(100, 300, 10));
    player bob(BOB);
    assert_eql(SUCCESS, bob.init(100, 300, 10));

    std::map<int, std::string> msg; // messages exchanged during game

    // Start handshake
    assert_eql(SUCCESS, alice.create_handshake(msg[0]));
    assert_eql(CONTINUED, bob.process_handshake(msg[0], msg[1]));
    assert_eql(CONTINUED, alice.process_handshake(msg[1], msg[2]));
    assert_eql(CONTINUED, bob.process_handshake(msg[2], msg[3]));
    assert_eql(SUCCESS, alice.process_handshake(msg[3], msg[4]));
    assert_eql(SUCCESS, bob.process_handshake(msg[4], msg[5]));
    assert_eql(true, msg[5].size()==0);

    // Preflop: Alice folds
    assert_eql(SUCCESS, alice.create_bet(BET_FOLD, 0, msg[5]));
    assert_eql(game_step::GAME_OVER, alice.step());
    assert_eql(SUCCESS, bob.process_bet(msg[5], msg[6]));
    assert_eql(true, msg[6].size()==0);
    assert_eql(game_step::GAME_OVER, bob.step());
    assert_eql(BOB, alice.winner());
    assert_eql(BOB, bob.winner());
}

void test_next_msg_author() {
    player alice(ALICE);
    assert_eql(SUCCESS, alice.init(100, 300, 10));
    player bob(BOB);
    assert_eql(SUCCESS, bob.init(100, 300, 10));

    std::map<int, std::string> msg; // messages exchanged during game
     
    // Start handshake
    assert_eql(ALICE, alice.game().next_msg_author);
    assert_eql(ALICE, bob.game().next_msg_author);
    assert_eql(SUCCESS, alice.create_handshake(msg[0]));
    assert_eql(BOB, alice.game().next_msg_author);
    assert_eql(CONTINUED, bob.process_handshake(msg[0], msg[1]));
    assert_eql(ALICE, bob.game().next_msg_author);
    assert_eql(CONTINUED, alice.process_handshake(msg[1], msg[2]));
    assert_eql(BOB, alice.game().next_msg_author);
    assert_eql(CONTINUED, bob.process_handshake(msg[2], msg[3]));
    assert_eql(ALICE, bob.game().next_msg_author);
    assert_eql(SUCCESS, alice.process_handshake(msg[3], msg[4]));
    assert_eql(ALICE, alice.game().next_msg_author);
    assert_eql(SUCCESS, bob.process_handshake(msg[4], msg[5]));
    assert_eql(ALICE, bob.game().next_msg_author);

    // Preflop: Alice calls
    assert_eql(SUCCESS, alice.create_bet(BET_CALL, 0, msg[5]));
    assert_eql(BOB, alice.game().next_msg_author);
    assert_eql(SUCCESS, bob.process_bet(msg[5], msg[6]));
    assert_eql(BOB, bob.game().next_msg_author);

    // Preflop: Bob checks
    assert_eql(CONTINUED, bob.create_bet(BET_CHECK, 0, msg[6]));
    assert_eql(ALICE, bob.game().next_msg_author);
    assert_eql(SUCCESS, alice.process_bet(msg[6], msg[7]));
    assert_eql(BOB, alice.game().next_msg_author);
    assert_eql(SUCCESS, bob.process_bet(msg[7], msg[8]));
    assert_eql(BOB, bob.game().next_msg_author);

    // Flop: Bob raises
    assert_eql(SUCCESS, bob.create_bet(BET_RAISE, 10, msg[9]));
    assert_eql(ALICE, bob.game().next_msg_author);
    assert_eql(SUCCESS, alice.process_bet(msg[9], msg[10]));
    assert_eql(ALICE, alice.game().next_msg_author);
    
    // Flop: Alice calls
    assert_eql(CONTINUED, alice.create_bet(BET_CALL, 0, msg[12]));
    assert_eql(BOB, alice.game().next_msg_author);
    assert_eql(SUCCESS, bob.process_bet(msg[12], msg[13]));
    assert_eql(BOB, bob.game().next_msg_author);
    assert_eql(SUCCESS, alice.process_bet(msg[13], msg[14]));
    assert_eql(BOB, alice.game().next_msg_author);

    // Turn: Bob checks
    assert_eql(SUCCESS, bob.create_bet(BET_CHECK, 0, msg[15]));
    assert_eql(ALICE, bob.game().next_msg_author);
    assert_eql(SUCCESS, alice.process_bet(msg[15], msg[16]));
    assert_eql(ALICE, alice.game().next_msg_author);

    // Turn: Alice checks
    assert_eql(CONTINUED, alice.create_bet(BET_CHECK, 0, msg[17]));
    assert_eql(BOB, alice.game().next_msg_author);
    assert_eql(SUCCESS, bob.process_bet(msg[17], msg[18]));
    assert_eql(BOB, bob.game().next_msg_author);
    assert_eql(SUCCESS, alice.process_bet(msg[18], msg[19]));
    assert_eql(BOB, alice.game().next_msg_author);

    // River: Bob checks
    assert_eql(SUCCESS, bob.create_bet(BET_CHECK, 0, msg[20]));
    assert_eql(ALICE, bob.game().next_msg_author);
    assert_eql(SUCCESS, alice.process_bet(msg[20], msg[21]));
    assert_eql(ALICE, alice.game().next_msg_author);

    // River: Alice raises
    assert_eql(SUCCESS, alice.create_bet(BET_RAISE, 10, msg[22]));
    assert_eql(BOB, alice.game().next_msg_author);
    assert_eql(SUCCESS, bob.process_bet(msg[22], msg[23]));
    assert_eql(BOB, bob.game().next_msg_author);

    // River: Bob calls
    assert_eql(CONTINUED, bob.create_bet(BET_CALL, 0, msg[24]));
    assert_eql(ALICE, bob.game().next_msg_author);
    assert_eql(CONTINUED, alice.process_bet(msg[24], msg[25]));
    assert_eql(BOB, alice.game().next_msg_author);
    assert_eql(SUCCESS, bob.process_bet(msg[25], msg[26]));
    assert_eql(NONE, bob.game().next_msg_author);
    assert_eql(SUCCESS, alice.process_bet(msg[26], msg[27]));
    assert_eql(NONE, alice.game().next_msg_author);
}

int main(int argc, char** argv) {
    init_poker_lib();
    test_the_happy_path();
    test_fold();
    test_next_msg_author();
    std::cout << "---- SUCCESS - " TEST_SUITE_NAME << std::endl;
    return 0;
}
