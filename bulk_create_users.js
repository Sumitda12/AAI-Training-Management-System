import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';

// Initialize Supabase client (use your service_role key here)
const supabase = createClient(
  "https://kokywibfyqaylatrkyka.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtva3l3aWJmeXFheWxhdHJreWthIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjc5OTE3MCwiZXhwIjoyMDk4Mzc1MTcwfQ.lQV1IGwAJ5iTO2jC03ITzYG5GjcgK-2yrFIrIqvfq7E"
);

const employees = [];

// Read employee.csv
fs.createReadStream("employee.csv")
  .pipe(csv())
  .on("data", (row) => employees.push(row))
  .on("end", async () => {
    for (const emp of employees) {
      if (!emp.employee_id) {
        console.error("Skipping row with missing employee_id:", emp);
        continue;
      }

      const fakeEmail = `${emp.employee_id.toLowerCase()}@yourcompany.internal`;

      const { data, error } = await supabase.auth.admin.createUser({
        email: fakeEmail,
        password: emp.password || "defaultPass123",
        email_confirm: true,
        user_metadata: {
          sr_no: emp.sr_no,
          employee_id: emp.employee_id,
          name: emp.name,
          designation: emp.designation
        }
      });

      if (error) {
        if (error.message.includes("already been registered")) {
          // Get all users
          const { data: listData, error: listError } = await supabase.auth.admin.listUsers();

          if (listError) {
            console.error("Error listing users:", listError.message);
            continue;
          }

          // listData.users is the array
          const existing = listData.users.find(u => u.email === fakeEmail);

          if (existing) {
            await supabase.auth.admin.updateUserById(existing.id, {
              user_metadata: {
                sr_no: emp.sr_no,
                employee_id: emp.employee_id,
                name: emp.name,
                designation: emp.designation
              }
            });
            console.log(`Updated: ${emp.employee_id}`);
          }
        } else {
          console.error(`Failed: ${emp.employee_id}`, error.message);
        }
      } else {
        console.log(`Created: ${emp.employee_id}`);
      }
    }
  });
