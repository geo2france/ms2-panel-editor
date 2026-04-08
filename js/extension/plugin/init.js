import React, { useEffect } from "react";

export default () =>
    (Component) =>
        ({ setup = () => {}, ...props }) => {
            useEffect(() => {
                if (props.active) {
                    setup(props?.pluginCfg || props?.cfg || {});
                }
            }, [props.active]);

            return <Component {...props} />;
        };
