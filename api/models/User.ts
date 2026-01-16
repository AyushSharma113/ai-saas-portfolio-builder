import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type HydratedDocument,
  type Model,
  type ValidatorProps,
} from "mongoose";

const UserSchema = new Schema(
  {
    /**
     * Unique Clerk user ID.
     * Used to associate MongoDB documents with Clerk accounts.
     */
    clerkId: { type: String, required: true, unique: true },

    /**
     * Optional email field.
     * Includes basic format validation.
     */

    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: (props: ValidatorProps) =>
          `${props.value} is not a valid email!`,
      },
    },

    name: {
      type: String,
      minlength: 2,
      maxlength: 50,
      required: false,
      trim: true,
    },
    /**
     * Role of the user in the system.
     * Defaults to `user`.
     */
    role: {
      type: String,
      enum: ["admin", "user"],
      required: false,
      default: "user",
    },

    /**
     * Subscription plan assigned to the user.
     * Defaults to `free`.
     */

    plan: {
      type: String,
      enum: ["free", "premium"],
      required: false,
      default: "free",
    },

    /**
     * Account status of the user.
     * Useful for banning or suspending users.
     */
    status: {
      type: String,
      enum: ["active", "banned", "suspended"],
      required: false,
      default: "active",
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);


export type UserType = InferSchemaType<typeof UserSchema>;
//{
//   name: string;
//   email: string;
//}




export type userDocument = HydratedDocument<UserType>
// hydratedDocument means a mongodb document that contains:
// - your schema fields and plus mongoose methods
// {
//   name: string;
//   email: string;
//   save(): Promise<this>;
//   populate(): ...
//   _id: ObjectId;
// }


type UserModel = Model<userDocument>; 
//UserModel is a Mongoose Model whose records are UserDocument type.”



// safe model export (prevents model overwrite for hot server reloads) 
const User = (models.User as UserModel) || model<UserType, UserModel>("User", UserSchema);

export default User


