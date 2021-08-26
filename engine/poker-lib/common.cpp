#include "common.h"

namespace poker {

bool logging_enabled = true;

game_error public_cards_range(game_step step, int& first_card_index, int& card_count) {
    switch(step) {
        case OPEN_FLOP:
            first_card_index = flop_card_index(0);
            card_count = 3;
            break;
        case OPEN_TURN:
            first_card_index = turn_card_index();
            card_count = 1;
            break;
        case OPEN_RIVER:
            first_card_index = river_card_index();
            card_count = 1;
            break;
        default:
            return PRR_INVALID_CARDS_PROOF_STEP;
    }
    return SUCCESS;
}

game_error read_exactly(std::istream& in, int len, std::string& dst) {
    char tmp[4096];
    dst = "";
    while(len) {
        if (!in.good())
            return END_OF_STREAM;
        int chunk = std::min(len, (int)sizeof(tmp));
        in.read(tmp, chunk);
        auto actual = in.gcount();
        if (!in.good() || actual==0)
            return END_OF_STREAM;
        dst += std::string(tmp, actual);
        len -= actual;
    }
    return SUCCESS;
}

std::string to_hex_dump(const void* addr, int len) {
    std::string s = "";
    unsigned char* data = (unsigned char*)addr;
    for(auto i=0; i<len; i++) {
        char tmp[10];
        sprintf(tmp, "%02x ", (int)data[i]);
        s += tmp;
    }
    return s;
}


}