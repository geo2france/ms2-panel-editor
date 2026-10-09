import axios from "@mapstore/libs/ajax";

const escapeXml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

const normalizeDateLiteral = (value) => {
    if (typeof value !== "string") {
        return value;
    }

    const normalizedValue = value.trim();
    const frenchDateMatch = normalizedValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (frenchDateMatch) {
        const [, day, month, year] = frenchDateMatch;
        return `${year}-${month}-${day}`;
    }

    return value;
};

const formatLiteralValue = (value) => {
    if (value === null || value === undefined) {
        return "";
    }
    return escapeXml(normalizeDateLiteral(value));
};

const buildWfsPropertiesBlock = (attributes = {}) =>
    Object.keys(attributes)
        .map((key) => `
            <wfs:Property>
                <wfs:Name>${escapeXml(key)}</wfs:Name>
                <wfs:Value>${formatLiteralValue(attributes[key])}</wfs:Value>
            </wfs:Property>
        `)
        .join("");

const buildFeatureFilter = (idField, idValue) => `
    <ogc:Filter>
        <ogc:PropertyIsEqualTo>
            <ogc:PropertyName>${escapeXml(idField)}</ogc:PropertyName>
            <ogc:Literal>${formatLiteralValue(idValue)}</ogc:Literal>
        </ogc:PropertyIsEqualTo>
    </ogc:Filter>
`;

const parseXmlResponse = (xmlText = "") => {
    if (!xmlText || typeof DOMParser === "undefined") {
        return null;
    }
    return new DOMParser().parseFromString(xmlText, "text/xml");
};

const getFirstNodeText = (xmlDocument, selectors = []) => {
    const node = selectors
        .map((selector) => xmlDocument?.querySelector(selector))
        .find((candidate) => !!candidate);
    return node?.textContent?.trim() || "";
};

const getWfsTransactionError = (responseData) => {
    if (typeof responseData !== "string") {
        return "";
    }

    const xmlDocument = parseXmlResponse(responseData);
    if (!xmlDocument) {
        return "";
    }

    const parserError = xmlDocument.querySelector("parsererror");
    if (parserError) {
        return parserError.textContent?.trim() || "Invalid XML response";
    }

    const exceptionMessage = getFirstNodeText(xmlDocument, [
        "ExceptionText",
        "ows\\:ExceptionText",
        "ServiceException"
    ]);
    if (exceptionMessage) {
        return exceptionMessage;
    }

    const transactionStatus = getFirstNodeText(xmlDocument, [
        "TransactionResult Status",
        "wfs\\:TransactionResult wfs\\:Status",
        "Status"
    ]);
    if (/failed/i.test(transactionStatus)) {
        return transactionStatus;
    }

    return "";
};

export const buildUpdateTransactionPayload = ({ typeName, idField, idValue, attributes }) => `
    <wfs:Transaction service="WFS" version="1.1.0"
        xmlns:wfs="http://www.opengis.net/wfs"
        xmlns:ogc="http://www.opengis.net/ogc">
        <wfs:Update typeName="${escapeXml(typeName)}">
            ${buildWfsPropertiesBlock(attributes)}
            ${buildFeatureFilter(idField, idValue)}
        </wfs:Update>
    </wfs:Transaction>
`;

export const buildDeleteTransactionPayload = ({ typeName, idField, idValue }) => `
    <wfs:Transaction service="WFS" version="1.1.0"
        xmlns:wfs="http://www.opengis.net/wfs"
        xmlns:ogc="http://www.opengis.net/ogc">
        <wfs:Delete typeName="${escapeXml(typeName)}">
            ${buildFeatureFilter(idField, idValue)}
        </wfs:Delete>
    </wfs:Transaction>
`;

export const postWfsTransaction = (url, xmlPayload, headers = {}) =>
    axios.post(url, xmlPayload, {
        headers: {
            "Content-Type": "text/xml",
            ...headers
        }
    }).then((response) => {
        const transactionError = getWfsTransactionError(response?.data);
        if (transactionError) {
            throw new Error(transactionError);
        }
        return response;
    });
