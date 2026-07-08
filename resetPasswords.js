import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://kokywibfyqaylatrkyka.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtva3l3aWJmeXFheWxhdHJreWthIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjc5OTE3MCwiZXhwIjoyMDk4Mzc1MTcwfQ.lQV1IGwAJ5iTO2jC03ITzYG5GjcgK-2yrFIrIqvfq7E" // not the anon key
);

async function resetPasswords() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(error);
    return;
  }

  for (const user of data.users) {
    await supabase.auth.admin.updateUserById(user.id, {
      password: "Welcome@123"
    });
    console.log(`Password reset for ${user.email}`);
  }
}

resetPasswords();
