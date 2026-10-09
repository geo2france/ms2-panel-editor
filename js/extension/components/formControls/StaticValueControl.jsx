import React from "react";
import PropTypes from "prop-types";
import { FormControl } from "react-bootstrap";

/**
 * Static value renderer kept for compatibility with legacy usages.
 * @param {object} props Component props.
 * @returns {React.ReactElement} Static form control.
 */
const StaticValueControl = ({ value }) => (
    <FormControl.Static>
        {String(value ?? "")}
    </FormControl.Static>
);

StaticValueControl.propTypes = {
    value: PropTypes.any
};

StaticValueControl.defaultProps = {
    value: ""
};

export default StaticValueControl;
