import { createClient } from "@supabase/supabase-js";
import readline from "readline";

// Initialize Supabase client
const supabase = createClient(
  "https://kokywibfyqaylatrkyka.supabase.co",
  "sb_publishable_K6rbahsiuQbDrXN4XV1jOg_wy2VlHFY"
);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function loginEmployee(employee_id, password) {
  const email = `${employee_id.toLowerCase()}@yourcompany.internal`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("❌ Login failed:", error.message);
  } else {
    console.log("✅ Login successful:", data.user);
  }
}

// Ask for input
rl.question("Enter Employee ID: ", (employee_id) => {
  rl.question("Enter Password: ", async (password) => {
    await loginEmployee(employee_id, password);
    rl.close();
  });
});
