-- CreateTable
CREATE TABLE "TestSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clave" TEXT NOT NULL,
    "edad" TEXT NOT NULL,
    "sexo" TEXT NOT NULL,
    "estadoCivil" TEXT NOT NULL,
    "hijos" TEXT NOT NULL,
    "profesion" TEXT NOT NULL,
    "responses" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
