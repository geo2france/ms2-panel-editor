import { t } from "./i18n";

const isEmpty = (value) => value === null || value === undefined
    || (typeof value === "string" && value.trim() === "");
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export const validateFieldValue = (value, field = {}, locale) => {
    if (isEmpty(value)) {
        return field.required ? t(locale, "requiredField") : "";
    }
    if (["string", "text", "textarea"].includes(field.type) && hasOwn(field, "pattern")) {
        if (typeof field.pattern !== "string") {
            return t(locale, "invalidValidationConfig");
        }
        try {
            if (!new RegExp(field.pattern).test(String(value))) {
                return field.validationMessage || t(locale, "invalidTextPattern");
            }
        } catch (error) {
            return t(locale, "invalidValidationConfig");
        }
    }
    if (field.type === "number") {
        const bounds = ["min", "max"].filter((key) => hasOwn(field, key));
        if (bounds.some((key) => typeof field[key] !== "number" || !Number.isFinite(field[key]))
            || (hasOwn(field, "min") && hasOwn(field, "max") && field.min > field.max)) {
            return t(locale, "invalidValidationConfig");
        }
        const numericValue = Number(value);
        const isNumeric = (typeof value === "number" || (typeof value === "string"
            && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())))
            && Number.isFinite(numericValue);
        if (!isNumeric) {
            return field.validationMessage || t(locale, "invalidNumber");
        }
        if (bounds.some((key) => key === "min" ? numericValue < field.min : numericValue > field.max)) {
            const message = bounds.length === 2
                ? `${t(locale, "numberBetween")} ${field.min} ${t(locale, "and")} ${field.max}.`
                : `${t(locale, bounds[0] === "min" ? "numberMinimum" : "numberMaximum")} ${field[bounds[0]]}.`;
            return field.validationMessage || message;
        }
    }
    return "";
};
