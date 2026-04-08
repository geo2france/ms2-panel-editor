import axios from "@mapstore/libs/ajax";

const normalizeFieldKey = (fieldName = "") =>
    String(fieldName || "")
        .trim()
        .toLowerCase()
        .replace(/^.*[.:]/, "");

const toCandidateRecords = (data) => {
    if (Array.isArray(data)) {
        return data;
    }
    if (Array.isArray(data?.features)) {
        return data.features;
    }
    if (Array.isArray(data?.items)) {
        return data.items;
    }
    if (Array.isArray(data?.data)) {
        return data.data;
    }
    return [];
};

const getRecordValue = (record = {}, fieldName = "") => {
    let value;
    const properties = record?.properties || {};
    const recordKeys = Object.keys(record || {});
    const propertyKeys = Object.keys(properties);
    const normalizedFieldName = normalizeFieldKey(fieldName);

    if (!record || !fieldName) {
        return value;
    }
    if (Object.prototype.hasOwnProperty.call(record, fieldName)) {
        value = record[fieldName];
    } else if (Object.prototype.hasOwnProperty.call(record?.properties || {}, fieldName)) {
        value = record.properties[fieldName];
    } else {
        const matchingRecordKey = recordKeys.find((key) => normalizeFieldKey(key) === normalizedFieldName);
        const matchingPropertyKey = propertyKeys.find((key) => normalizeFieldKey(key) === normalizedFieldName);

        if (matchingRecordKey) {
            value = record[matchingRecordKey];
        } else if (matchingPropertyKey) {
            value = properties[matchingPropertyKey];
        } else {
            const usablePropertyKeys = propertyKeys.filter((key) => properties[key] !== null && properties[key] !== undefined && key !== "geometry");
            const usableRecordKeys = recordKeys.filter((key) =>
                record[key] !== null
                && record[key] !== undefined
                && key !== "geometry"
                && key !== "properties"
                && key !== "type"
                && key !== "id"
            );

            if (usablePropertyKeys.length === 1) {
                value = properties[usablePropertyKeys[0]];
            } else if (usableRecordKeys.length === 1) {
                value = record[usableRecordKeys[0]];
            }
        }
    }

    return value;
};

export const getListFieldOptions = (url, fieldName) =>
    axios.get(url)
        .then((response) => response?.data)
        .then((data) => {
            const seenValues = new Set();

            return toCandidateRecords(data).reduce((acc, record) => {
                const value = getRecordValue(record, fieldName);
                const normalizedValue = value === null || value === undefined ? "" : String(value);

                if (!normalizedValue || seenValues.has(normalizedValue)) {
                    return acc;
                }

                seenValues.add(normalizedValue);
                acc.push(value);
                return acc;
            }, []);
        });
