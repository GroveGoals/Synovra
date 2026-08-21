import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isValidUsername(username) {
return /^[a-z][a-z0-9_]{2,29}$/.test(username);
}

export async function GET(req) {
try {
const { searchParams } = new URL(req.url);
const username = (searchParams.get("username") || "").trim();

if (!username) {  
  return NextResponse.json({  
    status: "idle",  
  });  
}  

if (username.length < 3) {  
  return NextResponse.json({  
    status: "invalid",  
    message: "Username must be at least 3 characters.",  
  });  
}  

if (username.length > 30) {  
  return NextResponse.json({  
    status: "invalid",  
    message: "Username must be 30 characters or fewer.",  
  });  
}  

if (!isValidUsername(username)) {  
  return NextResponse.json({  
    status: "invalid",  
    message:  
      "Username must start with a lowercase letter and use only lowercase letters, numbers, or underscores.",  
  });  
}  

const existing = await prisma.user.findUnique({  
  where: {  
    username,  
  },  
  select: {  
    id: true,  
  },  
});  

if (existing) {  
  return NextResponse.json({  
    status: "taken",  
    message: "That username is already taken.",  
  });  
}  

return NextResponse.json({  
  status: "available",  
  message: "Username is available.",  
});

} catch (error) {
console.error("Username check error:", error);

return NextResponse.json(  
  {  
    status: "error",  
    message: "Unable to check username right now.",  
  },  
  { status: 500 }  
);

}
}