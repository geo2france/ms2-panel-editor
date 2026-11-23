import expect from "expect";
import { validateFieldValue } from "../fieldValidation";
import { getEditableFieldChanges } from "../conditionalFields";
import { getConfiguredFields } from "../attributes";

const validate = (value, field) => validateFieldValue(value, field, "fr-FR");
const text = { type: "string", pattern: "^[0-9]{5}$", validationMessage: "Code postal invalide." };
const number = { type: "number", min: -10, max: 20 };

describe("Panel Editor field validation", () => {
    it("validates text patterns and returns the configured message", () => {
        expect(validate("75001", text)).toBe("");
        ["7500", "750001", "abcde", " 75001 "].forEach((value) => {
            expect(validate(value, text)).toBe("Code postal invalide.");
        });
        expect(validate("ABC", { type: "textarea", pattern: "^[A-Z]+$" })).toBe("");
        const alias = getConfiguredFields({ fields: [{ name: "code", type: "text", pattern: text.pattern }] })[0];
        expect(validate("invalid", alias)).toBe("La valeur ne respecte pas le format attendu.");
    });

    it("ignores regex rules on non-text controls", () => {
        ["list", "date", "geocoding", "reverse-geocoding"].forEach((type) => {
            expect(validate("abc", { type, pattern: "[" })).toBe("");
        });
        expect(validate(10, { ...number, pattern: "^letters$" })).toBe("");
    });

    it("allows empty optional fields and keeps required validation", () => {
        ["", "  ", null, undefined].forEach((value) => {
            expect(validate(value, text)).toBe("");
            expect(validate(value, number)).toBe("");
            expect(validate(value, { ...text, required: true })).toBe("Champ obligatoire");
            expect(validate(value, { ...number, required: true })).toBe("Champ obligatoire");
        });
    });

    it("rejects malformed patterns without throwing or accepting invalid input", () => {
        ["[", null, 123].forEach((pattern) => {
            expect(validate("abc", { ...text, pattern })).toBe("La configuration de validation du champ est invalide.");
        });
    });

    it("accepts both inclusive bounds, zero and decimal values", () => {
        [-10, 20, 0, -9.5, "-10", "20", "0", "19.75", "2e1"].forEach((value) => {
            expect(validate(value, number)).toBe("");
        });
        [-10.01, 20.01, "-11", "21"].forEach((value) => {
            expect(validate(value, number)).toBe("Saisir un nombre compris entre -10 et 20.");
        });
        expect(validate(21, { ...number, validationMessage: "Hors limites." })).toBe("Hors limites.");
    });

    it("supports individual bounds including zero", () => {
        expect(validate(-1, { type: "number", min: 0 })).toBe("Saisir un nombre supérieur ou égal à 0.");
        expect(validate(1, { type: "number", max: 0 })).toBe("Saisir un nombre inférieur ou égal à 0.");
        expect(validate(0, { type: "number", min: 0, max: 0 })).toBe("");
        expect(validate(-12.5, { type: "number" })).toBe("");
    });

    it("rejects nonnumeric and nonfinite input", () => {
        ["abc", "NaN", "Infinity", "0x10", "1,5", true, [], Infinity, NaN].forEach((value) => {
            expect(validate(value, number)).toBe("Saisir un nombre valide.");
        });
    });

    it("reports invalid bound configurations", () => {
        [{ min: 20, max: -10 }, { min: "-10" }, { max: null }, { max: Infinity }].forEach((bounds) => {
            expect(validate(0, { type: "number", ...bounds })).toBe("La configuration de validation du champ est invalide.");
        });
    });

    it("validates active editable fields before collecting changes", () => {
        const layerConfig = { fields: [
            { name: "code", ...text },
            { name: "amount", ...number },
            { name: "disabled", ...text, editableIf: { field: "code", eq: "OTHER" } },
            { name: "locked", ...number, readOnly: true },
            { name: "restricted", ...text, roles: ["OTHER"] }
        ] };
        const params = {
            locale: "fr-FR", userRoles: ["EDITOR"], layerConfig,
            selectedAttributes: { code: "75001", amount: 0, disabled: "invalid", locked: 100, restricted: "invalid" }
        };
        const invalid = getEditableFieldChanges({ ...params, formValues: { code: "invalid", amount: 21 } });
        expect(invalid.validationErrors).toEqual({ code: "Code postal invalide.", amount: "Saisir un nombre compris entre -10 et 20." });
        expect(invalid.changedAttributes).toEqual({});
        const valid = getEditableFieldChanges({ ...params, formValues: { code: "69001", amount: -10 } });
        expect(valid.validationErrors).toEqual({});
        expect(valid.changedAttributes).toEqual({ code: "69001", amount: -10 });
        expect(getEditableFieldChanges({ ...params, formValues: {} }).validationErrors).toEqual({});
    });
});
