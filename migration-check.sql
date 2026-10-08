SELECT
  migration_name,
  checksum,
  finished_at,
  applied_steps_count
FROM "_prisma_migrations"
WHERE migration_name = '20261002230232_vendor_compliance_requirement';
