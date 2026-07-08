import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://kokywibfyqaylatrkyka.supabase.co", // replace with your project URL
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtva3l3aWJmeXFheWxhdHJreWthIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjc5OTE3MCwiZXhwIjoyMDk4Mzc1MTcwfQ.lQV1IGwAJ5iTO2jC03ITzYG5GjcgK-2yrFIrIqvfq7E"                 // replace with service role key
);

async function createUsers(employees) {
  for (const emp of employees) {
    const email = `${emp.employee_id}@yourcompany.internal`;

    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: "Welcome@123", // default password
      user_metadata: {
        employee_id: emp.employee_id,
        name: emp.name,
        role: emp.role,
      },
    });

    if (error) {
      console.error(`Error creating ${email}:`, error.message);
    } else {
      console.log(`Created user: ${email}`);
    }
  }
}

// ✅ Add your employees here
const employees = [
  { employee_id: "10001199", name: "Shri A. A. Ansari", role: "admin" },
  { employee_id: "10001158", name: "Shri Arjun Kumar", role: "employee" },
  // add more employees...
];

// ✅ Call the function
createUsers(employees);
