import path from "path";
import { runTests } from "./runTests";

runTests(path.join(__dirname, "../", "guides"), ".ats");
