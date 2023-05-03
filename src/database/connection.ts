import mongoose from "mongoose";

export async function databaseConnection(uri: string): Promise<void> {
	await mongoose.connect(uri);
}
