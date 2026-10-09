import axios from "@mapstore/libs/ajax";

export const getAreaOfCompetence = (source = {}) => {
    const restrictedAreaSource = typeof source === "string" ? { url: source } : (source || {});
    const fallbackWkt = restrictedAreaSource?.wkt;

    if (fallbackWkt) {
        return Promise.resolve(fallbackWkt);
    }

    const url = restrictedAreaSource?.url;
    if (!url) {
        return Promise.resolve(null);
    }

    return axios.get(url).then((response) => response?.data);
};
