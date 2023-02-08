import { Router, Request, Response, NextFunction } from "express";
import numbers from "../numbers";
import { login } from "../middleware/login";
import { Group, validate } from "../models/Group";
import { WidthUser } from "../middleware/login";
import { isValidObjectId } from "mongoose";
import { User } from "../models/User";
const router = Router()

// Get number for one user
router.get("/get-num/:id", (req, res) => {
  const id: number = +req.params.id
  res.json({ number: numbers[id] })
})

// Get groups
router.get("/get-groups", login, async (req: WidthUser, res) => {
  try {
    const groups = await Group.find({ "members._id": req.user?._id }).populate("createdBy", "name")
    const group = await Group.find({ createdBy: req.user?._id }).populate("createdBy", "name")
    groups.map(item => {
      for (let i of item.members) {
        if (i._id && req.user?._id && i._id?.equals(req.user?._id)) {
          item.status = i.status;
          break;
        }
      }
    })



    return res.json({ myGroup: group, otherGroup: groups })
  } catch (error) {
    return res.status(401).json({ error })
  }
})

// Get users
router.get("/get-users", login, async (req: WidthUser, res) => {
  const name = req.query.name
  const allUser = await User.find().select("-password")
  const users = await User.find({ name: new RegExp(`^${name}`, "i") }).select("-password")
  name ? res.json(users) : res.json(allUser)
})

// Create group
router.post("/create-group", login, (req: WidthUser, res) => {
  if (!req.body.name) return res.status(401).json({ error: "Enter a name for the group" })

  const { error } = validate(req.body)
  if (error) return res.status(401).json({ error: error.details[0].message })

  const group = new Group({
    name: req.body.name,
    createdBy: req.user?._id
  })

  Group.find({ createdBy: req.user?._id })
    .then(result => {
      if (result.length >= 10) return res.status(401).json({ error: "It is not possible to open more than 10 groups" })

      for (let el of result) {
        if (el.name === req.body.name) {
          return res.status(401).json({ error: "There is a group with this name" })
        }
      }

      group.save().then(result => {
        return res.json({ group: result })
      }).catch(error => {
        return res.status(401).json(error)
      })
    }).catch(error => {
      return res.status(401).json(error)
    })
})

// Delete group
router.delete("/delete-group", login, (req: WidthUser, res) => {
  const groupId = req.query.groupId;
  if (!isValidObjectId(groupId)) return res.status(401).json({ error: "Invalid id number" })

  Group.findById(groupId)
    .then(group => {
      if (!group) return res.status(401).json({ error: "This group was not found" })

      if (group.createdBy && req.user?._id && !group.createdBy?.equals(req.user?._id)) return res.status(401).json({ error: "You cannot delete this group" })

      Group.findByIdAndRemove(groupId)
        .then(result => res.json(result))
        .catch(error => res.status(401).json(error))
    })
})

// Add player to group
router.put("/add-player", login, async (req: WidthUser, res) => {
  if (!isValidObjectId(req.body.group) || !isValidObjectId(req.body.player)) return res.status(401).json({ error: "Invalid id number" })

  const group = await Group.findById(req.body.group)
  const addPlayer = await User.findById(req.body.player)

  if (!group) return res.status(401).json({ error: "Group is not available" })
  if (!addPlayer) return res.status(401).json({ error: "Player is not available" })

  let owner;
  let lider;

  if (req.user?._id && group.createdBy && group?.createdBy?.equals(req.user?._id)) { owner = req.user?._id }
  if (group?.members) {
    for (let i of group?.members) {
      if (i._id && req.user?._id && i._id?.equals(req.user?._id)) {
        lider = i;
        break;
      }
    }
  }

  if (!owner && !lider) return res.status(401).json({ error: "You are not connected to this group" })
  if (!owner && lider?.status !== "leader") return res.status(401).json({ error: "You cannot add player to this group" })
  if (group?.members.length && group?.members.length >= 99) return res.status(401).json({ error: "The number of players in one group should not exceed 100" })

  if (group?.members) {
    for (let i of group?.members) {
      if (i._id?.equals(req.body.player)) return res.status(401).json({ error: "This player is available" })
    }
  }

  if (group.createdBy?.equals(req.body.player)) return res.status(401).json({ error: "This user is the owner of the group" })
  for (let i of addPlayer.notification) {
    if (i.groupId?.equals(group._id)) {
      return res.status(401).json({ error: "This player is already offered" })
    }
  }

  addPlayer.notification.push({ groupId: group._id, notificationBy: req.user?._id })

  await addPlayer.save()
    .then(result => {
      res.json({ message: `Request sent to ${result.name}` })
    })
    .catch(error => {
      res.status(401).json({ error })
    })
})

// Remove player from group
router.delete("/remove-player", login, async (req: WidthUser, res) => {
  try {
    const { playerID, groupID }: { playerID: string, groupID: string } = req.body
    if (!isValidObjectId(playerID) || !isValidObjectId(groupID)) return res.status(401).json({ error: "Invalid id number" })
    const player = await User.findById(playerID)
    const group = await Group.findById(groupID).populate("members._id", "name")
    if (!player) return res.status(401).json({ error: "This user was not found" })
    if (!group) return res.status(401).json({ error: "This group was not found" })
    if (!req.user?._id) throw new Error("Server error. Try later")
    let playerStatus = false;
    let owner = false;
    let status = false;

    if (group.createdBy?.equals(req.user?._id)) owner = true
    for (let i of group.members) {
      if (i._id?.equals(playerID)) {
        if (i.status === "leader") {
          playerStatus = true;
          break;
        }
      }
    }
    for (let i of group.members) {
      if (i._id?.equals(req.user._id)) {
        if (i.status === "leader") status = true
        break
      }
    }

    let extant = false;
    for (let i of group.members) {
      if (i._id?.equals(player._id)) {
        extant = true;
        break;
      }
    }
    if (!extant) return res.status(401).json({ error: "This player is not available" })
    if (!status && !owner) return res.status(401).json({ error: "You cannot remove the player" })
    if (status && playerStatus) return res.status(401).json({ error: "You cannot delete Leader" })

    group.members = group.members.filter(item => !item._id?.equals(player._id))
    await group.save()
      .then(result => {
        res.json({ members: result.members })
      })
      .catch(error => {
        res.status(500).json(error)
        throw new Error(error)
      })
  }
  catch (error) {
    console.log(error)
  }
})

// Accept group notification
router.put("/accept-notification/:id", login, async (req: WidthUser, res) => {
  const groupId = req.params.id;
  if (!isValidObjectId(groupId)) return res.status(401).json({ error: "Invalid id number" })
  const group = await Group.findById(groupId)
  const user = await User.findById(req.user?._id)
  if (!group) return res.status(401).json({ error: "This group was not fount" })
  if (!user) return res.status(401).json({ error: "Your account was not found" })

  let invite = false
  for (let i of user.notification) {
    if (i.groupId?.equals(group._id)) {
      invite = true;
      break;
    }
  }
  if (!invite) return res.status(401).json({ error: "You are not invited to this group" })

  for (let i of group.members) {
    if (i._id?.equals(user._id)) {
      return res.status(401).json({ error: "You already exists" })
    }
  }

  group.members.push({ _id: user._id, status: "player", codes: [] })

  const index = user.notification.findIndex(item => {
    if (item.groupId) {
      return item.groupId.equals(group._id)
    }
  })
  user.notification.splice(index, 1)

  await group.save()
    .then(async () => {
      await user.save()
        .then(data => {
          res.json(data.notification)
        })
    })
    .catch(error => {
      throw new Error(error)
    })
})

// Get number for group member
router.get("/group-number/:id", login, async (req: WidthUser, res) => {
  const id: string = req.params.id;
  const group = await Group.findById(id)
  if (!group) return res.status(401).json({ error: 'This group was not found' })

  let player = false;
  let codes: { code?: string; index?: number }[] = []

  if (!group?.createdBy || !req.user?._id) return res.status(500).json({ error: "Server error try later" })
  if (group.createdBy?.equals(req.user?._id)) {
    player = true
    group.codes.push({ code: numbers[group.count], index: group.count + 1 })
    codes = group.codes
  }


  group.members.map(item => {
    if (item._id && req.user?._id && item._id?.equals(req.user?._id)) {
      player = true;
      item.codes.push({ code: numbers[group.count], index: group.count + 1 })
      codes = item.codes
    }
  })

  if (!player) return res.status(401).json({ error: "You are not a member of this group" })
  if (group.count >= 10000) return res.status(401).json({ error: "All number entered" })

  group.count++
  group.save()
    .then(() => {
      return res.json({ number: numbers[group.count - 1], codes })
    })
})

// Get archive codes
router.get("/archive-codes/:id", login, (req: WidthUser, res) => {
  const groupId: string = req.params.id

  Group.findById(groupId)
    .then(result => {
      if (!result) return res.status(401).json({ error: "This group was not found" })
      let codes: { code?: string; index?: number }[] = []
      let player;
      if (!result?.createdBy || !req.user?._id) throw new Error("(!result?.createdBy || !req.user?._id) shart ishga tushdi")
      if (result?.createdBy?.equals(req.user?._id)) {
        codes = result.codes
        player = 'creater'
      } else {
        for (let i of result.members) {
          if (i._id && i._id.equals(req.user._id)) {
            codes = i.codes;
            player = "player"
            break;
          }
        }
      }

      if (!player) return res.status(401).json({ error: "You are not a member of this group" })

      return res.json({ codes })
    })
    .catch(error => {
      res.status(401).json({ error })
    })
})

// Get group members
router.get("/group-members/:id", login, (req: WidthUser, res) => {
  const id = req.params.id;
  try {
    Group.findById(id)
      .populate("members._id", "name")
      .populate("createdBy", "name")
      .then(result => {
        if (!result) return res.status(401).json({ error: "Group was not found" })
        let player = false
        if (!req.user?._id) throw new Error("user id was not found")
        if (result.createdBy?.equals(req.user._id)) {
          player = true
        } else {
          for (let i of result.members) {
            if (i._id?.equals(req.user._id)) {
              player = true
            }
          }
        }

        if (!player) return res.status(401).json({ error: "You are not a member of this group" })

        return res.json({ members: result.members, owner: { name: result.createdBy, codes: result.codes } })
      })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error })
  }
})

// Get notifications
router.get("/get-notifications", login, async (req: WidthUser, res) => {
  const user = await User.findById(req.user?._id)
    .populate("notification.groupId", "name")
    .populate("notification.notificationBy", "name")
  if (!user) return res.status(401).json({ error: "Your account was not found" })
  return res.json(user.notification)
})

// Status
router.put("/status", login, async (req: WidthUser, res) => {
  const { groupId, userId } = req.body;
  if (!req.body.status) return res.status(401).json({ error: "Enter the status" })
  if (req.body.status !== "player" && req.body.status !== "leader") return res.status(401).json({ error: "Enter the correct status" })
  const status: "player" | "leader" = req.body.status
  if (!isValidObjectId(groupId || !isValidObjectId(userId))) return res.status(401).json({ error: "Invalid id number" })
  if (!status) return res.status(401).json({ error: "Status must not be empty" })
  const group = await Group.findById(groupId).populate("members._id", 'name')
  const user = await User.findById(req.user?._id)

  if (!group) return res.status(401).json({ error: "This group was not found" })
  if (!req.user?._id) throw new Error("Status Leader / req.user._id was not found")
  if (!group.createdBy?.equals(req.user._id)) return res.status(401).json({ error: "You cannot change the status" })

  let member = false;
  for (let i of group.members) {
    if (i._id?.equals(userId)) {
      member = true;
      break;
    }
  }
  if (!member) return res.status(401).json({ error: "This player is not a member of the group" })
  if (user?._id.equals(userId)) return res.status(401).json({ error: "This player is the owner of the group" })

  group.members.map(item => {
    if (item._id?.equals(userId)) {
      return item.status = status
    }
  })

  await group.save()
    .then((result) => {
      res.json({ members: result.members })
    })
    .catch(error => {
      throw new Error(error)
    })
})

export default router