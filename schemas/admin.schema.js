const Joi = require("joi");

const name = Joi.string();
const password = Joi.string();
const level = Joi.number().integer().min(0).max(4);

const adminInsertSchema = Joi.object({
    name: name.required(),
    password: password.required(),
    level : level.required()
});

const adminUpdateSchema = Joi.object({
    name: name.required(),
    newName: name.required(),
    newPassword: password.required(),
    newLevel : level.required()
});

module.exports = { adminInsertSchema, adminUpdateSchema }
