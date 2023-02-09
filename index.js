"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const doorLock_1 = __importDefault(require("./router/doorLock"));
const auth_1 = __importDefault(require("./router/auth"));
const mongoose_1 = __importDefault(require("mongoose"));
const app = (0, express_1.default)();
mongoose_1.default.set("strictQuery", false);
mongoose_1.default.connect("mongodb://localhost/rustify", { family: 4 });
app.use(express_1.default.json());
try {
    app.use("/door-lock", doorLock_1.default);
}
catch (error) {
    console.log(error);
}
app.use("/login", auth_1.default);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log("Server has been started on port " + PORT);
});
