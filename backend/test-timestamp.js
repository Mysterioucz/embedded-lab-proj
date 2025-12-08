// Test timestamp parsing for STM32 format
// Usage: node test-timestamp.js

/**
 * Parse timestamp from STM32 format (DD/MM/YYYY HH:MM:SS)
 * @param {string} timeString - Time string from STM32
 * @returns {Date} Parsed date object
 */
function parseTimestamp(timeString) {
    try {
        // Format: "08/12/2025 14:01:57" (DD/MM/YYYY HH:MM:SS)
        const parts = timeString.trim().split(" ");
        if (parts.length !== 2) {
            throw new Error("Invalid timestamp format");
        }

        const [datePart, timePart] = parts;
        const [day, month, year] = datePart.split("/").map(Number);
        const [hours, minutes, seconds] = timePart.split(":").map(Number);

        // JavaScript Date expects: year, month (0-indexed), day, hours, minutes, seconds
        const date = new Date(year, month - 1, day, hours, minutes, seconds);

        // Validate the date
        if (isNaN(date.getTime())) {
            throw new Error("Invalid date values");
        }

        return date;
    } catch (error) {
        console.warn(`⚠️ Failed to parse timestamp "${timeString}": ${error.message}`);
        return new Date();
    }
}

// Test cases
console.log("🧪 Testing Timestamp Parsing\n");
console.log("=".repeat(60));

const testCases = [
    "08/12/2025 14:01:57",
    "01/01/2024 00:00:00",
    "31/12/2023 23:59:59",
    "15/06/2024 12:30:45",
];

testCases.forEach((testCase, index) => {
    console.log(`\nTest ${index + 1}:`);
    console.log(`  Input:  "${testCase}"`);

    const parsed = parseTimestamp(testCase);

    console.log(`  Output: ${parsed.toISOString()}`);
    console.log(`  Local:  ${parsed.toLocaleString()}`);

    // Verify components
    const [datePart, timePart] = testCase.split(" ");
    const [day, month, year] = datePart.split("/").map(Number);
    const [hours, minutes, seconds] = timePart.split(":").map(Number);

    console.log(`  Verify: Year=${parsed.getFullYear()}, Month=${parsed.getMonth() + 1}, Day=${parsed.getDate()}`);
    console.log(`          Hour=${parsed.getHours()}, Min=${parsed.getMinutes()}, Sec=${parsed.getSeconds()}`);

    // Check if parsing is correct
    const isCorrect =
        parsed.getFullYear() === year &&
        parsed.getMonth() + 1 === month &&
        parsed.getDate() === day &&
        parsed.getHours() === hours &&
        parsed.getMinutes() === minutes &&
        parsed.getSeconds() === seconds;

    console.log(`  Status: ${isCorrect ? "✅ PASS" : "❌ FAIL"}`);
});

console.log("\n" + "=".repeat(60));

// Test with actual STM32 data format
console.log("\n📡 Testing with STM32 JSON format:\n");

const stm32Data = {
    temp: 26.0,
    hum: 74.0,
    lux: 216.4,
    time: "08/12/2025 14:01:57"
};

console.log("Input JSON:");
console.log(JSON.stringify(stm32Data, null, 2));

const parsedTime = parseTimestamp(stm32Data.time);
console.log("\nParsed timestamp:", parsedTime.toISOString());
console.log("Local time:", parsedTime.toLocaleString());

// Compare with wrong parsing (what was happening before)
const wrongParse = new Date(stm32Data.time);
console.log("\nWrong parsing (using new Date() directly):", wrongParse.toISOString());
console.log("Result: Invalid Date - " + (isNaN(wrongParse.getTime()) ? "❌ FAIL" : wrongParse.toISOString()));

console.log("\n✅ Test complete!");
