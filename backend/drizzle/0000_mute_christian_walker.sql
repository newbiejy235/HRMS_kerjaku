CREATE TABLE "cities" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"kota" varchar(255) NOT NULL,
	"provinsi_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "employes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"employee_code" varchar(30) NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255),
	"no_telp" varchar(20),
	"cities_id" integer NOT NULL,
	"hire_date" date NOT NULL,
	"employment_status" "employed_Status" DEFAULT 'active' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employes_employee_code_unique" UNIQUE("employee_code")
);
--> statement-breakpoint
CREATE TABLE "provinces_table" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "provinces_table_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"provinsi" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"employe_id" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(100) NOT NULL,
	"userRole" "userRole" DEFAULT 'Karyawan' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_employe_id_unique" UNIQUE("employe_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_provinsi_id_provinces_table_id_fk" FOREIGN KEY ("provinsi_id") REFERENCES "public"."provinces_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employes" ADD CONSTRAINT "employes_cities_id_cities_id_fk" FOREIGN KEY ("cities_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_employe_id_employes_id_fk" FOREIGN KEY ("employe_id") REFERENCES "public"."employes"("id") ON DELETE no action ON UPDATE no action;