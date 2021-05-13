#ifndef SOLVER_H
#define SOLVER_H

#include "card_type.h"
#include <cstdint>

namespace poker {

    class solver {
    public:
        solver();
        ~solver();
        int32_t compare_hands(const int32_t *hand1, const int32_t *hand2, int32_t hand_size);
    	const char* get_hand_name(const int32_t *hand, int32_t hand_size);
    };

} // namespace poker

#endif // SOLVER_H