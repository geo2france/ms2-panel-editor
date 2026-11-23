import React from "react";
import PropTypes from "prop-types";
import { FormControl } from "react-bootstrap";

/**
 * Number input used for numeric attribute editing.
 * @param {object} props Input props.
 * @returns {React.ReactElement} Number form control.
 */
const NumberInputControl = ({ value, onChange, disabled, min, max }) => (
    <FormControl
        type="number"
        value={value ?? ""}
        disabled={disabled}
        min={min}
        max={max}
        step="any"
        onChange={(event) => onChange(event.target.value)}
    />
);

NumberInputControl.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
    min: PropTypes.number,
    max: PropTypes.number
};

NumberInputControl.defaultProps = {
    value: "",
    onChange: () => {},
    disabled: false
};

export default NumberInputControl;
