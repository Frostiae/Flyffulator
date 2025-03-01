import { createContext, useState, useContext } from "react";

const SearchContext = createContext(undefined);

export function SearchProvider({ children }) {
    const [searchProperties, setSearchProperties] = useState(null);
    const [isSearchOpen, setSearchOpen] = useState(false);

    function showSearch(properties) {
        setSearchProperties(properties);
        setSearchOpen(true);
    }

    function hideSearch() {
        setSearchProperties(null);
        setSearchOpen(false);
    }

    return (
        <SearchContext.Provider value={{ showSearch, hideSearch, isSearchOpen, searchProperties }}>
            {children}
        </SearchContext.Provider>
    );
}

export function useSearch() {
    return useContext(SearchContext);
}