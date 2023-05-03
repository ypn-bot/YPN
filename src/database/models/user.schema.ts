import { Schema, model } from "mongoose";

export interface UserI {
	_id: string;
	aliases: { name: string; emojiId: string }[];
	preferences: { name: string; emojiId: string }[];
}

const UserSchema = new Schema({
	_id: { type: String, required: true },
	aliases: { type: [{ name: String, emojiId: String }], ref: "Emojis", default: [] },
	preferences: { type: [{ name: String, emojiId: String }], ref: "Emojis", default: [] },
});

export const UserModel = model('Users', UserSchema);