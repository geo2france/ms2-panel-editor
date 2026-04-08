import { toModulePlugin } from "@mapstore/utils/ModulePluginsUtils";
import { name } from "../../../config";

export default toModulePlugin(name, () => import(/* webpackChunkName: "extension" */ "./Module"));
