import { AtlasFalse } from "./AtlasFalse";
import { AtlasNull } from "./AtlasNull";
import { AtlasNumber } from "./AtlasNumber";
import { AtlasString } from "./AtlasString";
import { AtlasTrue } from "./AtlasTrue";

export type AtlasValue = AtlasTrue | AtlasFalse | AtlasNull | AtlasNumber | AtlasString;
