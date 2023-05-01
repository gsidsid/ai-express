import { CollectionConfig } from "payload/types";

const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
    {
      name: "role",
      type: "select",
      options: [
        { label: "Viewer", value: "viewer" },
        { label: "Editor", value: "editor" },
        { label: "Admin", value: "admin" },
      ],
      defaultValue: "editor",
      saveToJWT: true,
      required: true,
      admin: {
        description:
          "The role this user belongs to. Admins can manage users, editors can do everything else, and viewers can read data and try endpoints in the AIx UI, but do not have access to your API key.",
      },
    },
  ],
};

export default Users;
