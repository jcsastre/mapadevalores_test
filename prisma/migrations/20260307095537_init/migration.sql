-- CreateTable
CREATE TABLE "Group" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestSubmission" (
    "id" SERIAL NOT NULL,
    "clave" TEXT NOT NULL,
    "edad" TEXT NOT NULL,
    "sexo" TEXT NOT NULL,
    "estadoCivil" TEXT NOT NULL,
    "hijos" TEXT NOT NULL,
    "profesion" TEXT NOT NULL,
    "responses" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" INTEGER,

    CONSTRAINT "TestSubmission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TestSubmission" ADD CONSTRAINT "TestSubmission_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
