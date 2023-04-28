"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Users = {
    slug: "users",
    auth: true,
    admin: {
        useAsTitle: "name",
    },
    access: {
        read: function () { return true; },
    },
    fields: [
        // Email added by default
        {
            name: "name",
            type: "text",
        },
    ],
};
exports.default = Users;
