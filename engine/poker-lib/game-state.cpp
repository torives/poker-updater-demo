#include <iostream>
#include "game-state.h"

namespace poker {

game_error game_state::get_player_hand(int player, card_t* hand) {
    card_t* aux = hand;

    if (player != ALICE && player != BOB)
        return GRR_INVALID_PLAYER;

    for (auto i = 0; i < NUM_PRIVATE_CARDS; i++) {
        card_t card = players[player].cards[i];
        *aux++ = card;
    }

    for (auto i = 0; i < NUM_PUBLIC_CARDS; i++) {
        card_t card = public_cards[i];
        *aux++ = card;
    }
    return SUCCESS;
}

std::string game_state::to_json(char* extra_fields) {
    char json[1024];
    auto& p0 = players[0];
    auto& p1 = players[1];
    snprintf(json, sizeof(json), "{"
        "\"current_player\": %d, "
        "\"next_msg_author\": %d, "
        "\"error\": %d, "
        "\"winner\": %d, "
        "\"public_cards\": [%d, %d, %d, %d, %d], "
        "\"players\": ["
            "{\"id\": %d, \"total_funds\": \"%s\", \"bets\": \"%s\", \"cards\":[%d, %d]},"
            "{\"id\": %d, \"total_funds\": \"%s\", \"bets\": \"%s\", \"cards\":[%d, %d]}"
        "],"
        "\"funds_share\":[\"%s\", \"%s\"], "
        "\"last_aggressor\": %d, "
        "\"muck\": %d "
        "%s %s" // extra fields
        "}",
        current_player, next_msg_author, (int)error, winner,
        public_cards[0], public_cards[1], public_cards[2],
        public_cards[3], public_cards[4],
        p0.id, p0.total_funds.to_string().c_str(), p0.bets.to_string().c_str(), p0.cards[0], p0.cards[1],
        p1.id, p1.total_funds.to_string().c_str(), p1.bets.to_string().c_str(), p1.cards[0], p1.cards[1],
        funds_share[0].to_string().c_str(), funds_share[1].to_string().c_str(), 
        last_aggressor, 
        muck,
        (extra_fields ? "," : ""),  (extra_fields ? extra_fields : "")
    );
    return std::string(json);
}


}  // namespace poker