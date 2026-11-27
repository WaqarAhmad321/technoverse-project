import "server-only";
import { randomInt } from "node:crypto";

// No 0/O, 1/I/L: people read these codes aloud and type them from paper.
const READABLE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const RECEIPT_CODE_LENGTH = 6;
const VERIFY_CODE_LENGTH = 10;

export function readableCode(length: number): string {
  return Array.from({ length }, () => READABLE_ALPHABET[randomInt(READABLE_ALPHABET.length)]).join("");
}

export function newReceiptCode(): string {
  return `IMT-${readableCode(RECEIPT_CODE_LENGTH)}`;
}

export function newVerifyCode(): string {
  return readableCode(VERIFY_CODE_LENGTH);
}
