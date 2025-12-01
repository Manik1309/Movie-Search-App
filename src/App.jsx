import React, { useState, useEffect } from "react";
import Axios from "axios";
import styled from "styled-components";
import MovieComponent from "./components/MovieComponent";
import MovieInfoComponent from "./components/MovieInfoComponent";

import search_icon from "./assets/search-icon.svg";
import movie_icon from "./assets/movie-icon.svg";

export const API_KEY = "a9118a3a";

// ---------------------------------------------
// Styled Components
// ---------------------------------------------
const Container = styled.div`
  display: flex;
  flex-direction: column;
`;
const AppName = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;
const Header = styled.div`
  background-color: black;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  font-size: 25px;
  font-weight: bold;
  box-shadow: 0 3px 6px 0 #555;
`;
const SearchBox = styled.div`
  display: flex;
  flex-direction: row;
  padding: 10px 10px;
  border-radius: 6px;
  margin-left: 20px;
  width: 40%;
  background-color: white;
`;
const SearchIcon = styled.img`
  width: 28px;
  height: 28px;
`;
const MovieImage = styled.img`
  width: 48px;
  height: 48px;
  margin: 15px;
`;
const SearchInput = styled.input`
  color: black;
  font-size: 16px;
  border: none;
  outline: none;
  margin-left: 15px;
  width: 100%;
`;
const FiltersRow = styled.div`
  display: flex;
  gap: 10px;
  padding: 10px;
  justify-content: center;
  background: #f5f5f5;
`;
const Select = styled.select`
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #aaa;
`;
const YearInput = styled.input`
  padding: 8px;
  width: 100px;
  border: 1px solid #aaa;
  border-radius: 6px;
`;
const MovieListContainer = styled.div`
  background-color: bisque;
  display: flex;
  flex-wrap: wrap;
  padding: 30px;
  gap: 25px;
  justify-content: space-evenly;
`;
const Placeholder = styled.img`
  width: 120px;
  height: 120px;
  margin: 150px;
  opacity: 50%;
`;
const PaginationBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 20px;
`;
const PageButton = styled.button`
  padding: 8px 12px;
  border: none;
  background: ${(p) => (p.active ? "black" : "white")};
  color: ${(p) => (p.active ? "white" : "black")};
  border: 1px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
`;

// ---------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------
function App() {
  const [searchQuery, updateSearchQuery] = useState("");

  const [movieList, updateMovieList] = useState([]);
  const [selectedMovie, onMovieSelect] = useState();

  const [timeoutId, updateTimeoutId] = useState();

  // pagination state
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // filters
  const [typeFilter, setTypeFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  // ---------------------------------------------
  // Fetch Movies
  // ---------------------------------------------
  const fetchData = async (searchString, pageNumber = 1) => {
    if (!searchString) return;

    const response = await Axios.get(
      `https://www.omdbapi.com/?s=${searchString}&page=${pageNumber}&type=${typeFilter}&y=${yearFilter}&apikey=${API_KEY}`
    );

    if (response.data.Response === "True") {
      updateMovieList(response.data.Search);
      setTotalResults(Number(response.data.totalResults));
    } else {
      updateMovieList([]);
      setTotalResults(0);
    }
  };

  // ---------------------------------------------
  // Debounce Search
  // ---------------------------------------------
  const onTextChange = (e) => {
    onMovieSelect("");
    clearTimeout(timeoutId);
    updateSearchQuery(e.target.value);
    setPage(1);

    const timeout = setTimeout(() => fetchData(e.target.value, 1), 600);
    updateTimeoutId(timeout);
  };

  // ---------------------------------------------
  // Fetch when filters change
  // ---------------------------------------------
  useEffect(() => {
    if (searchQuery.trim() !== "") fetchData(searchQuery, 1);
  }, [typeFilter, yearFilter]);

  // ---------------------------------------------
  // Fetch when page changes
  // ---------------------------------------------
  useEffect(() => {
    if (searchQuery.trim() !== "") fetchData(searchQuery, page);
  }, [page]);

  const totalPages = Math.ceil(totalResults / 10);

  return (
    <Container>
      {/* HEADER */}
      <Header>
        <AppName>
          <MovieImage src={movie_icon} />
          React Movie App
        </AppName>

        <SearchBox>
          <SearchIcon src={search_icon} />
          <SearchInput
            placeholder="Search Movie"
            value={searchQuery}
            onChange={onTextChange}
          />
        </SearchBox>
      </Header>

      {/* FILTERS */}
      <FiltersRow>
        <Select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Types</option>
          <option value="movie">Movies</option>
          <option value="series">Series</option>
          <option value="episode">Episodes</option>
        </Select>

        <YearInput
          type="number"
          placeholder="Year"
          value={yearFilter}
          onChange={(e) => {
            setYearFilter(e.target.value);
            setPage(1);
          }}
        />
      </FiltersRow>

      {/* MOVIE DETAILS */}
      {selectedMovie && (
        <MovieInfoComponent
          selectedMovie={selectedMovie}
          onMovieSelect={onMovieSelect}
        />
      )}

      {/* MOVIE LIST */}
      <MovieListContainer>
        {movieList?.length ? (
          movieList.map((movie, index) => (
            <MovieComponent
              key={index}
              movie={{
                ...movie,
                Poster:
                  movie.Poster === "N/A" ? movie_icon : movie.Poster // FIX broken posters
              }}
              onMovieSelect={onMovieSelect}
            />
          ))
        ) : (
          <Placeholder src={movie_icon} />
        )}
      </MovieListContainer>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <PaginationBar>
          <PageButton
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            Prev
          </PageButton>

          {[...Array(totalPages)].map((_, i) => (
            <PageButton
              key={i}
              active={i + 1 === page}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </PageButton>
          ))}

          <PageButton
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next
          </PageButton>
        </PaginationBar>
      )}
    </Container>
  );
}

export default App;
