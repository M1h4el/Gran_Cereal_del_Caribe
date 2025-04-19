export default function generateCode(length = 10) {
return Math.random().toString(36).substr(2, length).toUpperCase();
}