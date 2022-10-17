import path from "path";
import { runTests } from "./runTests";

runTests(path.join(__dirname, "../", "src", "stdlib"), ".ats");
