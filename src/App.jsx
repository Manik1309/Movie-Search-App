import React, { useState, useEffect, useRef } from "react";
import Axios from "axios";
import styled from "styled-components";
import MovieComponent from "./components/MovieComponent";
import MovieInfoComponent from "./components/MovieInfoComponent";

import search_icon from "./assets/search-icon.svg";
import movie_icon from "./assets/movie-icon.svg";

export const API_KEY = "a9118a3a";

/* ---------- Styled Components (adjusted for responsiveness) ---------- */
const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  box-sizing: border-box;
`;

const AppHeader = styled.header`
  background-color: black;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  font-size: 20px;
  font-weight: 700;
  box-shadow: 0 3px 6px 0 #555;
  flex-wrap: wrap;
  gap: 10px;
`;

const AppName = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 6px;
  background-color: white;
  min-width: 220px;
  width: 38%;
  max-width: 520px;
  box-sizing: border-box;
  gap: 12px;
  flex: 1 1 320px;
`;

const SearchIcon = styled.img`
  width: 22px;
  height: 22px;
`;

const MovieImage = styled.img`
  width: 40px;
  height: 40px;
`;

const SearchInput = styled.input`
  color: black;
  font-size: 16px;
  border: none;
  outline: none;
  flex: 1 1 auto;
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 10px;
  padding: 12px;
  justify-content: center;
  background: #f5f5f5;
  flex-wrap: wrap;
`;

const Select = styled.select`
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #aaa;
`;

const YearInput = styled.input`
  padding: 8px;
  width: 120px;
  border: 1px solid #aaa;
  border-radius: 6px;
`;

/* Movie list container: centered and responsive */
const MovieListWrapper = styled.div`
  width: 100%;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  padding: 24px;
`;

const MovieListContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 10px;
  box-sizing: border-box;
  justify-content: center;
`;

/* Placeholder — centered and not huge margin that causes horizontal scroll */
const Placeholder = styled.img`
  width: 120px;
  height: 120px;
  margin: 80px auto;
  opacity: 0.5;
  display: block;
`;

const PaginationBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 18px;
  flex-wrap: wrap;
  box-sizing: border-box;
`;

const PageButton = styled.button`
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
  background: ${(p) => (p.active ? "black" : "white")};
  color: ${(p) => (p.active ? "white" : "black")};
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* -------------------- Main App -------------------- */
function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [movieList, setMovieList] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const debounceRef = useRef(null);

  // pagination state
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // filters
  const [typeFilter, setTypeFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const totalPages = Math.max(1, Math.ceil(totalResults / 10));

  // Build query params safely
  const buildUrl = (s, pageNumber = 1) => {
    const q = encodeURIComponent(s.trim());
    let url = `https://www.omdbapi.com/?s=${q}&page=${pageNumber}&apikey=${API_KEY}`;
    if (typeFilter) url += `&type=${encodeURIComponent(typeFilter)}`;
    if (yearFilter) url += `&y=${encodeURIComponent(yearFilter)}`;
    return url;
  };

  // Fetch function (defensive)
  const fetchData = async (searchString, pageNumber = 1) => {
    const q = (searchString || "").trim();
    if (!q) {
      setMovieList([]);
      setTotalResults(0);
      return;
    }

    try {
      const url = buildUrl(q, pageNumber);
      const response = await Axios.get(url);

      if (response?.data?.Response === "True") {
        setMovieList(response.data.Search || []);
        setTotalResults(Number(response.data.totalResults) || 0);
      } else {
        setMovieList([]);
        setTotalResults(0);
      }
    } catch (err) {
      // fail gracefully
      console.error("OMDB fetch error:", err);
      setMovieList([]);
      setTotalResults(0);
    }
  };

  // Debounced input handler
  const onTextChange = (e) => {
    setSelectedMovie(null);
    const text = e.target.value;
    setSearchQuery(text);
    setPage(1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchData(text, 1);
      debounceRef.current = null;
    }, 600);
  };

  // When filters change -> fetch page 1 (only if there is a query)
  useEffect(() => {
    if (searchQuery.trim() !== "") {
      setPage(1);
      fetchData(searchQuery, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, yearFilter]);

  // When page changes -> fetch that page (only if there is a query)
  useEffect(() => {
    if (searchQuery.trim() !== "") {
      fetchData(searchQuery, page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Pagination button window generation (limits UI)
  const renderPageButtons = () => {
    const pages = [];
    const windowSize = 5; // show up to 5 pages around current
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);

    // expand range if near edges
    if (page <= 3) {
      end = Math.min(totalPages, windowSize);
      start = 1;
    } else if (page >= totalPages - 2) {
      start = Math.max(1, totalPages - (windowSize - 1));
      end = totalPages;
    }

    if (start > 1) {
      pages.push(
        <PageButton key={1} onClick={() => setPage(1)}>
          1
        </PageButton>
      );
      if (start > 2) pages.push(<span key="left-ellipsis">...</span>);
    }

    for (let p = start; p <= end; p++) {
      pages.push(
        <PageButton key={p} active={p === page} onClick={() => setPage(p)}>
          {p}
        </PageButton>
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push(<span key="right-ellipsis">...</span>);
      pages.push(
        <PageButton key={totalPages} onClick={() => setPage(totalPages)}>
          {totalPages}
        </PageButton>
      );
    }

    return pages;
  };

  return (
    <Container>
      <AppHeader>
        <AppName>
          <MovieImage src={movie_icon} alt="app" />
          React Movie App
        </AppName>

        <SearchBox>
          <SearchIcon src={search_icon} alt="search" />
          <SearchInput
            placeholder="Search Movie"
            value={searchQuery}
            onChange={onTextChange}
          />
        </SearchBox>
      </AppHeader>

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

      {selectedMovie && (
        <MovieInfoComponent
          selectedMovie={selectedMovie}
          onMovieSelect={setSelectedMovie}
        />
      )}

      <MovieListWrapper>
        <MovieListContainer>
          {movieList?.length ? (
            movieList.map((movie, index) => (
              <MovieComponent
                key={`${movie.imdbID || index}`}
                movie={{
                  ...movie,
                  Poster: movie.Poster === "N/A" ? movie_icon : movie.Poster,
                }}
                onMovieSelect={setSelectedMovie}
              />
            ))
          ) : (
            <Placeholder src={movie_icon} alt="no results" />
          )}
        </MovieListContainer>
      </MovieListWrapper>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <PaginationBar>
          <PageButton onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
            Prev
          </PageButton>

          {renderPageButtons()}

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
