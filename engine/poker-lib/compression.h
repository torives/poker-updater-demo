#ifndef COMPRESSION_H
#define COMPRESSION_H

#include "common.h"

namespace poker {

const int wrap_max_len = 1024 * 64;
const int wrap_padding_size = 4096;

std::string wrap(const std::string& data);
game_error unwrap(const std::string& in, std::string& out);

game_error compress(const std::string& in, std::string &out);
game_error decompress(const std::string& in, std::string &out);

game_error compress_and_wrap(const std::string& in, std::string &out);
game_error unwrap_and_decompress(const std::string& in, std::string &out);

game_error unwrap_next(std::istream& in, std::string& out);
game_error unwrap_and_decompress_next(std::istream& is, std::string &out);

}

#endif