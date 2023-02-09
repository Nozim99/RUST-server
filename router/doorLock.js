"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const numbers_1 = __importDefault(require("../numbers"));
const login_1 = require("../middleware/login");
const Group_1 = require("../models/Group");
const mongoose_1 = require("mongoose");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
// Get number for one user
router.get("/get-num/:id", (req, res) => {
    const id = +req.params.id;
    res.json({ number: numbers_1.default[id] });
});
// Get groups
router.get("/get-groups", login_1.login, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const groups = yield Group_1.Group.find({ "members._id": (_a = req.user) === null || _a === void 0 ? void 0 : _a._id }).populate("createdBy", "name");
        const group = yield Group_1.Group.find({ createdBy: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id }).populate("createdBy", "name");
        groups.map(item => {
            var _a, _b, _c;
            for (let i of item.members) {
                if (i._id && ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) && ((_b = i._id) === null || _b === void 0 ? void 0 : _b.equals((_c = req.user) === null || _c === void 0 ? void 0 : _c._id))) {
                    item.status = i.status;
                    break;
                }
            }
        });
        return res.json({ myGroup: group, otherGroup: groups });
    }
    catch (error) {
        return res.status(401).json({ error });
    }
}));
// Get users
router.get("/get-users", login_1.login, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const name = req.query.name;
    const allUser = yield User_1.User.find().select("-password");
    const users = yield User_1.User.find({ name: new RegExp(`^${name}`, "i") }).select("-password");
    name ? res.json(users) : res.json(allUser);
}));
// Create group
router.post("/create-group", login_1.login, (req, res) => {
    var _a, _b;
    if (!req.body.name)
        return res.status(401).json({ error: "Enter a name for the group" });
    const { error } = (0, Group_1.validate)(req.body);
    if (error)
        return res.status(401).json({ error: error.details[0].message });
    const group = new Group_1.Group({
        name: req.body.name,
        createdBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id
    });
    Group_1.Group.find({ createdBy: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id })
        .then(result => {
        if (result.length >= 10)
            return res.status(401).json({ error: "It is not possible to open more than 10 groups" });
        for (let el of result) {
            if (el.name === req.body.name) {
                return res.status(401).json({ error: "There is a group with this name" });
            }
        }
        group.save().then(result => {
            return res.json({ group: result });
        }).catch(error => {
            return res.status(401).json(error);
        });
    }).catch(error => {
        return res.status(401).json(error);
    });
});
// Delete group
router.delete("/delete-group", login_1.login, (req, res) => {
    const groupId = req.query.groupId;
    if (!(0, mongoose_1.isValidObjectId)(groupId))
        return res.status(401).json({ error: "Invalid id number" });
    Group_1.Group.findById(groupId)
        .then(group => {
        var _a, _b, _c;
        if (!group)
            return res.status(401).json({ error: "This group was not found" });
        if (group.createdBy && ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) && !((_b = group.createdBy) === null || _b === void 0 ? void 0 : _b.equals((_c = req.user) === null || _c === void 0 ? void 0 : _c._id)))
            return res.status(401).json({ error: "You cannot delete this group" });
        Group_1.Group.findByIdAndRemove(groupId)
            .then(result => res.json(result))
            .catch(error => res.status(401).json(error));
    });
});
// Add player to group
router.put("/add-player", login_1.login, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    if (!(0, mongoose_1.isValidObjectId)(req.body.group) || !(0, mongoose_1.isValidObjectId)(req.body.player))
        return res.status(401).json({ error: "Invalid id number" });
    const group = yield Group_1.Group.findById(req.body.group);
    const addPlayer = yield User_1.User.findById(req.body.player);
    if (!group)
        return res.status(401).json({ error: "Group is not available" });
    if (!addPlayer)
        return res.status(401).json({ error: "Player is not available" });
    let owner;
    let lider;
    if (((_c = req.user) === null || _c === void 0 ? void 0 : _c._id) && group.createdBy && ((_d = group === null || group === void 0 ? void 0 : group.createdBy) === null || _d === void 0 ? void 0 : _d.equals((_e = req.user) === null || _e === void 0 ? void 0 : _e._id))) {
        owner = (_f = req.user) === null || _f === void 0 ? void 0 : _f._id;
    }
    if (group === null || group === void 0 ? void 0 : group.members) {
        for (let i of group === null || group === void 0 ? void 0 : group.members) {
            if (i._id && ((_g = req.user) === null || _g === void 0 ? void 0 : _g._id) && ((_h = i._id) === null || _h === void 0 ? void 0 : _h.equals((_j = req.user) === null || _j === void 0 ? void 0 : _j._id))) {
                lider = i;
                break;
            }
        }
    }
    if (!owner && !lider)
        return res.status(401).json({ error: "You are not connected to this group" });
    if (!owner && (lider === null || lider === void 0 ? void 0 : lider.status) !== "leader")
        return res.status(401).json({ error: "You cannot add player to this group" });
    if ((group === null || group === void 0 ? void 0 : group.members.length) && (group === null || group === void 0 ? void 0 : group.members.length) >= 99)
        return res.status(401).json({ error: "The number of players in one group should not exceed 100" });
    if (group === null || group === void 0 ? void 0 : group.members) {
        for (let i of group === null || group === void 0 ? void 0 : group.members) {
            if ((_k = i._id) === null || _k === void 0 ? void 0 : _k.equals(req.body.player))
                return res.status(401).json({ error: "This player is available" });
        }
    }
    if ((_l = group.createdBy) === null || _l === void 0 ? void 0 : _l.equals(req.body.player))
        return res.status(401).json({ error: "This user is the owner of the group" });
    for (let i of addPlayer.notification) {
        if ((_m = i.groupId) === null || _m === void 0 ? void 0 : _m.equals(group._id)) {
            return res.status(401).json({ error: "This player is already offered" });
        }
    }
    addPlayer.notification.push({ groupId: group._id, notificationBy: (_o = req.user) === null || _o === void 0 ? void 0 : _o._id });
    yield addPlayer.save()
        .then(result => {
        res.json({ message: `Request sent to ${result.name}` });
    })
        .catch(error => {
        res.status(401).json({ error });
    });
}));
// Remove player from group
router.delete("/remove-player", login_1.login, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _p, _q, _r, _s, _t, _u;
    try {
        const { playerID, groupID } = req.body;
        if (!(0, mongoose_1.isValidObjectId)(playerID) || !(0, mongoose_1.isValidObjectId)(groupID))
            return res.status(401).json({ error: "Invalid id number" });
        const player = yield User_1.User.findById(playerID);
        const group = yield Group_1.Group.findById(groupID).populate("members._id", "name");
        if (!player)
            return res.status(401).json({ error: "This user was not found" });
        if (!group)
            return res.status(401).json({ error: "This group was not found" });
        if (!((_p = req.user) === null || _p === void 0 ? void 0 : _p._id))
            throw new Error("Server error. Try later");
        let playerStatus = false;
        let owner = false;
        let status = false;
        if ((_q = group.createdBy) === null || _q === void 0 ? void 0 : _q.equals((_r = req.user) === null || _r === void 0 ? void 0 : _r._id))
            owner = true;
        for (let i of group.members) {
            if ((_s = i._id) === null || _s === void 0 ? void 0 : _s.equals(playerID)) {
                if (i.status === "leader") {
                    playerStatus = true;
                    break;
                }
            }
        }
        for (let i of group.members) {
            if ((_t = i._id) === null || _t === void 0 ? void 0 : _t.equals(req.user._id)) {
                if (i.status === "leader")
                    status = true;
                break;
            }
        }
        let extant = false;
        for (let i of group.members) {
            if ((_u = i._id) === null || _u === void 0 ? void 0 : _u.equals(player._id)) {
                extant = true;
                break;
            }
        }
        if (!extant)
            return res.status(401).json({ error: "This player is not available" });
        if (!status && !owner)
            return res.status(401).json({ error: "You cannot remove the player" });
        if (status && playerStatus)
            return res.status(401).json({ error: "You cannot delete Leader" });
        group.members = group.members.filter(item => { var _a; return !((_a = item._id) === null || _a === void 0 ? void 0 : _a.equals(player._id)); });
        yield group.save()
            .then(result => {
            res.json({ members: result.members });
        })
            .catch(error => {
            res.status(500).json(error);
            throw new Error(error);
        });
    }
    catch (error) {
        console.log(error);
    }
}));
// Accept group notification
router.put("/accept-notification/:id", login_1.login, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _v, _w, _x;
    const groupId = req.params.id;
    if (!(0, mongoose_1.isValidObjectId)(groupId))
        return res.status(401).json({ error: "Invalid id number" });
    const group = yield Group_1.Group.findById(groupId);
    const user = yield User_1.User.findById((_v = req.user) === null || _v === void 0 ? void 0 : _v._id);
    if (!group)
        return res.status(401).json({ error: "This group was not fount" });
    if (!user)
        return res.status(401).json({ error: "Your account was not found" });
    let invite = false;
    for (let i of user.notification) {
        if ((_w = i.groupId) === null || _w === void 0 ? void 0 : _w.equals(group._id)) {
            invite = true;
            break;
        }
    }
    if (!invite)
        return res.status(401).json({ error: "You are not invited to this group" });
    for (let i of group.members) {
        if ((_x = i._id) === null || _x === void 0 ? void 0 : _x.equals(user._id)) {
            return res.status(401).json({ error: "You already exists" });
        }
    }
    group.members.push({ _id: user._id, status: "player", codes: [] });
    const index = user.notification.findIndex(item => {
        if (item.groupId) {
            return item.groupId.equals(group._id);
        }
    });
    user.notification.splice(index, 1);
    yield group.save()
        .then(() => __awaiter(void 0, void 0, void 0, function* () {
        yield user.save()
            .then(data => {
            res.json(data.notification);
        });
    }))
        .catch(error => {
        throw new Error(error);
    });
}));
// Get number for group member
router.get("/group-number/:id", login_1.login, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _y, _z, _0;
    const id = req.params.id;
    const group = yield Group_1.Group.findById(id);
    if (!group)
        return res.status(401).json({ error: 'This group was not found' });
    let player = false;
    let codes = [];
    if (!(group === null || group === void 0 ? void 0 : group.createdBy) || !((_y = req.user) === null || _y === void 0 ? void 0 : _y._id))
        return res.status(500).json({ error: "Server error try later" });
    if ((_z = group.createdBy) === null || _z === void 0 ? void 0 : _z.equals((_0 = req.user) === null || _0 === void 0 ? void 0 : _0._id)) {
        player = true;
        group.codes.push({ code: numbers_1.default[group.count], index: group.count + 1 });
        codes = group.codes;
    }
    group.members.map(item => {
        var _a, _b, _c;
        if (item._id && ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) && ((_b = item._id) === null || _b === void 0 ? void 0 : _b.equals((_c = req.user) === null || _c === void 0 ? void 0 : _c._id))) {
            player = true;
            item.codes.push({ code: numbers_1.default[group.count], index: group.count + 1 });
            codes = item.codes;
        }
    });
    if (!player)
        return res.status(401).json({ error: "You are not a member of this group" });
    if (group.count >= 10000)
        return res.status(401).json({ error: "All number entered" });
    group.count++;
    group.save()
        .then(() => {
        return res.json({ number: numbers_1.default[group.count - 1], codes });
    });
}));
// Get archive codes
router.get("/archive-codes/:id", login_1.login, (req, res) => {
    const groupId = req.params.id;
    Group_1.Group.findById(groupId)
        .then(result => {
        var _a, _b, _c;
        if (!result)
            return res.status(401).json({ error: "This group was not found" });
        let codes = [];
        let player;
        if (!(result === null || result === void 0 ? void 0 : result.createdBy) || !((_a = req.user) === null || _a === void 0 ? void 0 : _a._id))
            throw new Error("(!result?.createdBy || !req.user?._id) shart ishga tushdi");
        if ((_b = result === null || result === void 0 ? void 0 : result.createdBy) === null || _b === void 0 ? void 0 : _b.equals((_c = req.user) === null || _c === void 0 ? void 0 : _c._id)) {
            codes = result.codes;
            player = 'creater';
        }
        else {
            for (let i of result.members) {
                if (i._id && i._id.equals(req.user._id)) {
                    codes = i.codes;
                    player = "player";
                    break;
                }
            }
        }
        if (!player)
            return res.status(401).json({ error: "You are not a member of this group" });
        return res.json({ codes });
    })
        .catch(error => {
        res.status(401).json({ error });
    });
});
// Get group members
router.get("/group-members/:id", login_1.login, (req, res) => {
    const id = req.params.id;
    try {
        Group_1.Group.findById(id)
            .populate("members._id", "name")
            .populate("createdBy", "name")
            .then(result => {
            var _a, _b, _c;
            if (!result)
                return res.status(401).json({ error: "Group was not found" });
            let player = false;
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id))
                throw new Error("user id was not found");
            if ((_b = result.createdBy) === null || _b === void 0 ? void 0 : _b.equals(req.user._id)) {
                player = true;
            }
            else {
                for (let i of result.members) {
                    if ((_c = i._id) === null || _c === void 0 ? void 0 : _c.equals(req.user._id)) {
                        player = true;
                    }
                }
            }
            if (!player)
                return res.status(401).json({ error: "You are not a member of this group" });
            return res.json({ members: result.members, owner: { name: result.createdBy, codes: result.codes } });
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
});
// Get notifications
router.get("/get-notifications", login_1.login, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _1;
    const user = yield User_1.User.findById((_1 = req.user) === null || _1 === void 0 ? void 0 : _1._id)
        .populate("notification.groupId", "name")
        .populate("notification.notificationBy", "name");
    if (!user)
        return res.status(401).json({ error: "Your account was not found" });
    return res.json(user.notification);
}));
// Status
router.put("/status", login_1.login, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _2, _3, _4, _5;
    const { groupId, userId } = req.body;
    if (!req.body.status)
        return res.status(401).json({ error: "Enter the status" });
    if (req.body.status !== "player" && req.body.status !== "leader")
        return res.status(401).json({ error: "Enter the correct status" });
    const status = req.body.status;
    if (!(0, mongoose_1.isValidObjectId)(groupId || !(0, mongoose_1.isValidObjectId)(userId)))
        return res.status(401).json({ error: "Invalid id number" });
    if (!status)
        return res.status(401).json({ error: "Status must not be empty" });
    const group = yield Group_1.Group.findById(groupId).populate("members._id", 'name');
    const user = yield User_1.User.findById((_2 = req.user) === null || _2 === void 0 ? void 0 : _2._id);
    if (!group)
        return res.status(401).json({ error: "This group was not found" });
    if (!((_3 = req.user) === null || _3 === void 0 ? void 0 : _3._id))
        throw new Error("Status Leader / req.user._id was not found");
    if (!((_4 = group.createdBy) === null || _4 === void 0 ? void 0 : _4.equals(req.user._id)))
        return res.status(401).json({ error: "You cannot change the status" });
    let member = false;
    for (let i of group.members) {
        if ((_5 = i._id) === null || _5 === void 0 ? void 0 : _5.equals(userId)) {
            member = true;
            break;
        }
    }
    if (!member)
        return res.status(401).json({ error: "This player is not a member of the group" });
    if (user === null || user === void 0 ? void 0 : user._id.equals(userId))
        return res.status(401).json({ error: "This player is the owner of the group" });
    group.members.map(item => {
        var _a;
        if ((_a = item._id) === null || _a === void 0 ? void 0 : _a.equals(userId)) {
            return item.status = status;
        }
    });
    yield group.save()
        .then((result) => {
        res.json({ members: result.members });
    })
        .catch(error => {
        throw new Error(error);
    });
}));
exports.default = router;
