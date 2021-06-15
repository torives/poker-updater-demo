#include <iostream>
#include <vector>

#include "cards.h"
#include "game.h"
#include "test-util.h"
#include "validator.h"

using namespace std;
using namespace poker;
using namespace poker::cards;

#define TEST_SUITE_NAME "Test Validator"

#define TIE 2
#define BIG_BLIND 10

struct card_fixture {
    vector<card_t> alice, bob, community;
};

struct bet_fixture {
    vector<money_t> alice, bob;
};

struct card_fixtures {
    card_fixture alice_high_ace{{hA, dQ}, {hJ, h9}, {c7, s6, c4, d3, h2}};
    card_fixture bob_high_ace{{hJ, h9}, {hA, dQ}, {c7, s6, c4, d3, h2}};
    card_fixture tie{{s3, h2}, {s4, c3}, {cJ, sT, c9, d3, h3}};
} cf;

struct bet_fixtures {
    bet_fixture equal_bets{{100, 10}, {100, 10}};
    bet_fixture equal_bets_alice_more_funds{{200, 10}, {100, 10}};
    bet_fixture alice_higher_bet{{100, 20}, {100, 10}};
    bet_fixture alice_higher_bet_bob_no_funds{{100, 20}, {10, 10}};
    bet_fixture bob_higher_bet{{100, 10}, {100, 20}};
    bet_fixture first_action{{100, 5}, {100, 10}};
} bf;

void setup_cards(game_state &g, card_fixture cards) {
    for (auto i = 0; i < NUM_PRIVATE_CARDS; i++) {
        g.players[ALICE].cards[i] = cards.alice[i];
        g.players[BOB].cards[i] = cards.bob[i];
    }

    for (auto i = 0; i < NUM_PUBLIC_CARDS; i++) {
        g.public_cards[i] = cards.community[i];
    }
}

void setup_bets(game_state &g, bet_fixture bets) {
    g.players[ALICE].total_funds = bets.alice[0];
    g.players[ALICE].bets = bets.alice[1];

    g.players[BOB].total_funds = bets.bob[0];
    g.players[BOB].bets = bets.bob[1];

    g.big_blind = BIG_BLIND;
}

game_state g;
game_error err;

void reset_state() {
    g = game_state();
    err = ERR_INVALID_MOVE;
}

void set_state(card_fixture cards) {
    reset_state();
    setup_cards(g, cards);
}

void set_state(bet_phase phase = PHS_PREFLOP, int player = ALICE,
               bet_fixture bets = bf.equal_bets) {
    reset_state();
    g.phase = phase;
    g.current_player = player;
    setup_bets(g, bets);
}

int main(int argc, char **argv) {
    /**
     *
     * decide_winner
     *
     */

    // Given ALICE's hand is better
    // Alice wins
    set_state(cf.alice_high_ace);
    decide_winner(g);
    assert_eql(ALICE, g.winner);

    // Given BOB's hand is better
    // BOB wins
    set_state(cf.bob_high_ace);
    decide_winner(g);
    assert_eql(BOB, g.winner);

    // Given ALICE's and BOB's hands are the same
    // Its a tie
    set_state(cf.tie);
    decide_winner(g);
    assert_eql(TIE, g.winner);

    /**
     *
     * During PREFLOP
     *
     */

    // Given bets are equal
    // When BOB checks
    // It works
    set_state(PHS_PREFLOP, BOB, bf.equal_bets);

    err = place_bet(g, BET_CHECK);

    assert_eql(SUCCESS, err);
    assert_eql(PHS_FLOP, g.phase);
    assert_eql(BOB, g.current_player);

    // Given BOB's bet is higher
    // When ALICE calls the big blind
    // It works
    set_state(PHS_PREFLOP, ALICE, bf.first_action);

    err = place_bet(g, BET_CALL);

    assert_eql(SUCCESS, err);
    assert_eql(PHS_PREFLOP, g.phase);
    assert_eql(BOB, g.current_player);

    // Given BOB's bet is higher
    // When ALICE folds
    // It works
    set_state(PHS_PREFLOP, ALICE, bf.first_action);

    err = place_bet(g, BET_FOLD);

    assert_eql(err, SUCCESS);
    assert_eql(BOB, g.winner);
    assert_eql(PHS_SHOWDOWN, g.phase);
    assert_eql(BOB, g.current_player);

    // Given BOB's bet is higher and ALICE already called the big blind
    // When ALICE calls
    // It works
    set_state(PHS_PREFLOP, ALICE, bf.bob_higher_bet);

    err = place_bet(g, BET_CALL);

    assert_eql(SUCCESS, err);
    assert_eql(PHS_FLOP, g.phase);
    assert_eql(BOB, g.current_player);

    /**
     *
     * After PREFLOP
     *
     */

    // Given bets are equal
    // When BOB calls
    // It fails
    set_state(PHS_FLOP, BOB, bf.equal_bets);

    err = place_bet(g, BET_CALL);

    assert_eql(GRR_OPPONENT_BET_NOT_HIGHER, err);
    assert_eql(GRR_OPPONENT_BET_NOT_HIGHER, g.error);

    // Given bets are equal
    // When BOB raises
    // It works
    set_state(PHS_FLOP, BOB, bf.equal_bets);

    err = place_bet(g, BET_RAISE, BIG_BLIND);

    assert_eql(SUCCESS, err);
    assert_eql(PHS_FLOP, g.phase);
    assert_eql(ALICE, g.current_player);

    // Given bets are equal
    // When BOB checks
    // It works
    set_state(PHS_FLOP, BOB, bf.equal_bets);

    err = place_bet(g, BET_CHECK);

    assert_eql(SUCCESS, err);
    assert_eql(PHS_FLOP, g.phase);
    assert_eql(ALICE, g.current_player);

    // Given bets are equal
    // When BOB folds
    // It works
    set_state(PHS_FLOP, BOB, bf.equal_bets);

    err = place_bet(g, BET_FOLD);

    assert_eql(err, SUCCESS);
    assert_eql(ALICE, g.winner);
    assert_eql(PHS_SHOWDOWN, g.phase);
    assert_eql(ALICE, g.current_player);

    // Given bets are equal
    // When ALICE checks
    // It works
    set_state(PHS_FLOP, ALICE, bf.equal_bets);

    err = place_bet(g, BET_CHECK);

    assert_eql(SUCCESS, err);
    assert_eql(PHS_TURN, g.phase);
    assert_eql(BOB, g.current_player);

    // Given bets are equal
    // When ALICE raises less than the big blind
    // It fails
    set_state(PHS_FLOP, ALICE, bf.equal_bets);

    err = place_bet(g, BET_RAISE, BIG_BLIND - 1);

    assert_eql(GRR_BET_BELOW_MINIMUM, err);
    assert_eql(GRR_BET_BELOW_MINIMUM, g.error);

    // Given bets are equal and ALICE has more funds
    // When ALICE raises more than BOB's total funds
    // It fails
    set_state(PHS_FLOP, ALICE, bf.equal_bets_alice_more_funds);

    err = place_bet(g, BET_RAISE, BIG_BLIND * 10);

    assert_eql(GRR_BET_ABOVE_MAXIMUM, err);
    assert_eql(GRR_BET_ABOVE_MAXIMUM, g.error);

    // Given ALICE's bet is higher
    // When BOB calls
    // It works
    set_state(PHS_FLOP, BOB, bf.alice_higher_bet);

    err = place_bet(g, BET_CALL);

    assert_eql(SUCCESS, err);
    assert_eql(PHS_TURN, g.phase);
    assert_eql(BOB, g.current_player);

    // Given ALICE's bet is higher
    // When BOB raises
    // It works
    set_state(PHS_FLOP, BOB, bf.alice_higher_bet);

    err = place_bet(g, BET_RAISE, BIG_BLIND);

    assert_eql(SUCCESS, err);
    assert_eql(PHS_FLOP, g.phase);
    assert_eql(ALICE, g.current_player);

    // Given ALICE's bet is higher
    // When BOB checks
    // It fails
    set_state(PHS_FLOP, BOB, bf.alice_higher_bet);

    err = place_bet(g, BET_CHECK);

    assert_eql(GRR_BETS_NOT_EQUAL, err);
    assert_eql(GRR_BETS_NOT_EQUAL, g.error);

    // Given ALICE's bet is higher
    // When BOB folds
    // It works
    set_state(PHS_FLOP, BOB, bf.alice_higher_bet);

    err = place_bet(g, BET_FOLD);

    assert_eql(SUCCESS, err);
    assert_eql(ALICE, g.winner);
    assert_eql(PHS_SHOWDOWN, g.phase);
    assert_eql(ALICE, g.current_player);

    // Given ALICE's bet is higher and BOB doesn't have funds
    // When BOB calls
    // It fails
    set_state(PHS_FLOP, BOB, bf.alice_higher_bet_bob_no_funds);

    err = place_bet(g, BET_CALL);

    assert_eql(GRR_INSUFFICIENT_FUNDS, err);
    assert_eql(GRR_INSUFFICIENT_FUNDS, err);

    // Given ALICE's bet is higher and BOB doesn't have funds
    // When BOB raises
    // It fails
    set_state(PHS_FLOP, BOB, bf.alice_higher_bet_bob_no_funds);

    err = place_bet(g, BET_RAISE, BIG_BLIND);

    assert_eql(GRR_INSUFFICIENT_FUNDS, err);
    assert_eql(GRR_INSUFFICIENT_FUNDS, err);

    // Given BOB's bet is higher
    // When BOB calls
    // It fails
    set_state(PHS_FLOP, BOB, bf.bob_higher_bet);

    err = place_bet(g, BET_CALL);

    assert_eql(GRR_OPPONENT_BET_NOT_HIGHER, err);
    assert_eql(GRR_OPPONENT_BET_NOT_HIGHER, g.error);

    // Given BOB's bet is higher
    // When BOB raises
    // It fails
    set_state(PHS_FLOP, BOB, bf.bob_higher_bet);

    err = place_bet(g, BET_RAISE, BIG_BLIND);

    assert_eql(GRR_BET_ALREADY_HIGHER, err);
    assert_eql(GRR_BET_ALREADY_HIGHER, g.error);

    // Given BOB's bet is higher
    // When BOB checks
    // It fails
    set_state(PHS_FLOP, BOB, bf.bob_higher_bet);

    err = place_bet(g, BET_CHECK);

    assert_eql(GRR_BETS_NOT_EQUAL, err);
    assert_eql(GRR_BETS_NOT_EQUAL, g.error);

    // Given BOB's bet is higher
    // When BOB folds
    // It works
    set_state(PHS_FLOP, BOB, bf.bob_higher_bet);

    err = place_bet(g, BET_FOLD);

    assert_eql(SUCCESS, err);
    assert_eql(ALICE, g.winner);
    assert_eql(PHS_SHOWDOWN, g.phase);
    assert_eql(ALICE, g.current_player);

    cout << "---- SUCCESS - " TEST_SUITE_NAME << endl;
    return 0;
}
