-- CreateTable
CREATE TABLE "User" (
    "id_user" TEXT NOT NULL,
    "str_username" TEXT NOT NULL,
    "str_email" TEXT,
    "str_password" TEXT,
    "bl_admin" BOOLEAN NOT NULL DEFAULT false,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id_user")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_str_username_key" ON "User"("str_username");

-- CreateIndex
CREATE UNIQUE INDEX "User_str_email_key" ON "User"("str_email");
