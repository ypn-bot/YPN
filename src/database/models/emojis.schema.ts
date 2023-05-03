import { Schema, model } from "mongoose";

export interface EmojiI {
	name: string;
	_id: string;
	url: string;
	animated: boolean;
	partial: boolean;
	deleted: boolean;
}

const EmojiSchema = new Schema<EmojiI>({
	name: { type: String, required: true },
	_id: { type: String, required: true },
	url: { type: String, required: true },
	animated: { type: Boolean, required: true },
	partial: { type: Boolean, required: true },
	deleted: { type: Boolean, default: false },
});

export const EmojiModel = model("Emojis", EmojiSchema);
