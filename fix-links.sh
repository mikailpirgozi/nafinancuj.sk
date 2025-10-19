#!/bin/bash

# Script to replace <a> tags with <Link> components in dashboard files

FILES=(
  "src/app/dashboard/clients/[id]/page.tsx"
  "src/app/dashboard/clients/page.tsx"
  "src/app/dashboard/loans/[id]/page.tsx"
  "src/app/dashboard/loans/page.tsx"
  "src/app/dashboard/page.tsx"
  "src/app/dashboard/reminders/page.tsx"
  "src/app/dashboard/reports/page.tsx"
)

for file in "${FILES[@]}"; do
  echo "Processing $file..."
  
  # Add import if not present
  if ! grep -q "import Link from \"next/link\"" "$file"; then
    sed -i '' '/import { UserButton } from "@clerk\/nextjs";/a\
import Link from "next/link";
' "$file"
  fi
  
  # Replace <a href with <Link href
  sed -i '' 's/<a href="/<Link href="/g' "$file"
  
  # Replace </a> with </Link>
  sed -i '' 's/<\/a>/<\/Link>/g' "$file"
  
  echo "Done with $file"
done

echo "All files processed!"

