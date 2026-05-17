const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
  TableOfContents, Bookmark, InternalHyperlink
} = require('docx');
const fs = require('fs');
const path = require('path');

const BLUE = "1F5C99";
const LIGHT_BLUE = "D6E4F0";
const DARK = "1A1A2E";
const GRAY_TEXT = "555555";
const ACCENT = "E8F4FD";
const WHITE = "FFFFFF";
const TEAL = "0D6986";

// Color theme
const HEADING_COLOR = BLUE;
const Q_BG = LIGHT_BLUE;
const KEYWORD_COLOR = TEAL;

const pageWidth = 9360; // US Letter 8.5" - 2*1" margins

function hr() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } },
    spacing: { after: 0 }
  });
}

function sectionTitle(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: false,
    children: [new TextRun({ text, font: "Calibri", size: 32, bold: true, color: HEADING_COLOR })],
    spacing: { before: 240, after: 120 }
  });
}

function questionHeader(num, text) {
  // Question number badge + question text on shaded bg
  return new Paragraph({
    shading: { fill: Q_BG, type: ShadingType.CLEAR },
    pageBreakBefore: false,
    children: [
      new TextRun({ text: `Q${num}. `, font: "Calibri", size: 26, bold: true, color: BLUE }),
      new TextRun({ text, font: "Calibri", size: 26, bold: true, color: DARK }),
    ],
    spacing: { before: 320, after: 80 },
    indent: { left: 160, right: 160 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 12, color: BLUE, space: 8 }
    }
  });
}

function keywords(text) {
  if (!text) return null;
  return new Paragraph({
    children: [
      new TextRun({ text: "Key Topics: ", font: "Calibri", size: 18, bold: true, color: GRAY_TEXT, italics: true }),
      new TextRun({ text, font: "Calibri", size: 18, color: GRAY_TEXT, italics: true }),
    ],
    spacing: { before: 0, after: 120 },
    indent: { left: 160 }
  });
}

function subHeading(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Calibri", size: 22, bold: true, color: TEAL })],
    spacing: { before: 180, after: 60 },
  });
}

function para(text, opts = {}) {
  if (!text || text.trim() === '') return null;
  return new Paragraph({
    children: [new TextRun({ text, font: "Calibri", size: 20, color: DARK, ...opts })],
    spacing: { before: 60, after: 60 },
  });
}

function bullet(text, level = 0) {
  if (!text || text.trim() === '') return null;
  return new Paragraph({
    numbering: { reference: "bullets", level },
    children: [new TextRun({ text, font: "Calibri", size: 20, color: DARK })],
    spacing: { before: 40, after: 40 },
  });
}

function boldPara(label, rest) {
  return new Paragraph({
    children: [
      new TextRun({ text: label, font: "Calibri", size: 20, bold: true, color: TEAL }),
      new TextRun({ text: rest || '', font: "Calibri", size: 20, color: DARK }),
    ],
    spacing: { before: 60, after: 60 },
  });
}

function italic(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Calibri", size: 20, color: GRAY_TEXT, italics: true })],
    spacing: { before: 80, after: 80 },
    indent: { left: 360 }
  });
}

function spacer(sz = 80) {
  return new Paragraph({ children: [new TextRun("")], spacing: { before: sz, after: 0 } });
}

function makeTable(headers, rows, colWidths) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const totalW = colWidths.reduce((a, b) => a + b, 0);

  return new Table({
    width: { size: totalW, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: BLUE, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({
            children: [new TextRun({ text: h, font: "Calibri", size: 19, bold: true, color: WHITE })]
          })]
        }))
      }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, i) => new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: ri % 2 === 0 ? "F8FBFF" : WHITE, type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({
            children: [new TextRun({ text: cell, font: "Calibri", size: 19, color: DARK })]
          })]
        }))
      }))
    ]
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// Questions data
const questions = [
  {
    num: 1,
    q: "Tell me about a time you optimised a data pipeline",
    kw: "Spark optimization, AQE, GC, partition pruning, UDFs, built-in functions",
    content: [
      subHeading("Situation"),
      para("In a previous role as a Data Engineer, we processed a high volume of XML files from thousands of printers daily. These files arrived in different categories, landed in the Silver layer of our data lake partitioned on date. The existing Spark job fetched the previous day's files, joined them with device metadata (serial number, product number, etc.), performed transformations, and generated one output file per printer."),
      subHeading("Task"),
      para("The job was not meeting the SLA of 24 hours. Even though it ran on Spark, it was written in an object-oriented style with heavy nested function calls and for-loop processing one device at a time. This caused frequent GC errors, poor resource utilization, no proper partitioning, and overall inefficiency."),
      subHeading("Action"),
      para("First, I tried quick wins by tuning Spark configurations:"),
      bullet("Enabled Adaptive Query Execution (AQE)"),
      bullet("Configured off-heap memory"),
      bullet("Optimized JVM Garbage Collector settings"),
      bullet("Code refactoring — reduced nested function calls"),
      para("While these helped marginally, the fundamental design problems remained. I then led a complete redesign from a distributed computing perspective:"),
      bullet("Read all XML files at once with partition pruning into a Spark DataFrame with strict schema enforcement (struct types)"),
      bullet("Flattened data into columnar format"),
      bullet("Applied predicate pushdowns early to minimize data scanned"),
      bullet("Eliminated the for-loop entirely by leveraging Spark's native distributed processing"),
      bullet("Repartitioned strategically (based on printer/device keys) to improve parallelism"),
      bullet("Rewrote all transformations using built-in Spark SQL functions instead of UDFs — using joins, deduplication, from_xml, explode, etc."),
      subHeading("Result"),
      bullet("Processing time reduced from 20–40+ hours down to under 1 hour"),
      bullet("GC errors eliminated — major bottlenecks as GC errors block the job indefinitely"),
      bullet("Better cluster resource utilization and even distribution of workload"),
      bullet("Higher reliability, scalable, and easier maintenance"),
      para("This experience reinforced the importance of thinking in a 'Spark-native' way."),
    ]
  },
  {
    num: 2,
    q: "Tell me about a time you handled efficient deduplication with Delta Lake",
    kw: "Delta Lake, broadcast join, AQE, primary keys, lookup table",
    content: [
      para("One of the most interesting optimization challenges was in our printer telemetry pipeline. We had a Redshift warehouse table with millions of records. Every day we received thousands of new records — specifically the ink usage delta (current ink level vs. last recorded usage)."),
      para("The naive approach would have been to join the entire incoming dataset with the Redshift table, causing massive data movement, compute cost, and long runtimes."),
      subHeading("Solution: Selective Update Pattern"),
      boldPara("Small Delta Lookup Table: ", "Maintained a Delta table containing only the primary keys of all printers in the warehouse. This table remained small and was updated with each run with new printers appended."),
      boldPara("Classification Step (Broadcast Join): ", "Read incoming data from S3/Auto Loader. Performed a broadcast join with the small Delta PK table. Because the Delta table was tiny, Spark (with AQE enabled) automatically chose a Broadcast Hash Join — I also explicitly tuned the broadcast join threshold."),
      subHeading("Split & Process"),
      bullet("New printers → Simple append directly into Redshift"),
      bullet("Existing printers → Fetched only those specific rows from Redshift, then calculated the ink usage delta"),
      subHeading("Why This Was Efficient"),
      bullet("No full table scan or full join on the warehouse table"),
      bullet("The expensive part (fetch + update) was limited to only printers that actually needed updating"),
      bullet("Broadcast join avoids shuffle operation, making the Spark job significantly faster"),
      para("This was a classic example of using the right tool — leveraging Delta Lake for fast small lookups and broadcast joins with AQE to avoid unnecessary shuffling and full-table scans."),
    ]
  },
  {
    num: 3,
    q: "Walk me through a cost optimisation you led",
    kw: "S3 cost, Parquet, lifecycle policies, Glacier, small files, S3 Inventory",
    content: [
      subHeading("Situation"),
      para("With growing data volume, S3 Standard tier costs kept rising steadily. The Bronze layer contained a massive number of small XML and JSON files rarely accessed after initial processing. Additionally, there was redundant data that could be reproduced through transformations, and the high volume of tiny files was inflating metadata and API-related costs as data was not partitioned."),
      subHeading("Task"),
      para("Identify root causes through analysis of the AWS billing dashboard and lead a cost-optimization initiative focused on storage without impacting data availability or re-processing needs. The challenge: a naive move of millions of small files to Glacier tiers with Lifecycle policy would dramatically increase costs due to per-object transition fees and metadata overhead (~128 KB of metadata added per object)."),
      subHeading("Action"),
      bullet("Dove deep into the billing console and broke down costs by service"),
      bullet("Collaborated with stakeholders to define clear access frequency and retention requirements"),
      para("Designed a Spark-based batch job that:"),
      bullet("Used S3 Inventory to get object keys (avoids expensive LS API cost)"),
      bullet("Read raw XML/JSON files from S3 using Inventory details (last_modified_date)"),
      bullet("Extracted high-level metadata (serial number, product number, date, time)"),
      bullet("Consolidated and transformed into optimized Parquet format with partitioning and Z-ordering"),
      bullet("Wrote compacted Parquet files back to S3 Standard tier"),
      para("Then applied an S3 Lifecycle policy on the new Parquet files to automatically transition them to Glacier — avoiding direct transition costs on millions of small objects. Carefully estimated LIST/GET API operations and performed full cost estimations for the migration itself."),
      subHeading("Result"),
      bullet("~$300k USD in estimated annual savings based on forecasted data growth and billing trends"),
      bullet("Storage costs stabilized and began decreasing despite continued data volume growth"),
      bullet("New Parquet-based approach improved query performance for future re-processing"),
      bullet("Became a repeatable pattern for other data lakes"),
    ]
  },
  {
    num: 4,
    q: "Tell me about migrating an AWS EB application to PySpark on Databricks",
    kw: "Java Play Framework, Elastic Beanstalk, SQS, Databricks Auto Loader, PySpark Structured Streaming",
    content: [
      subHeading("Legacy Architecture"),
      para("We had a Java Play Framework application running on AWS Elastic Beanstalk doing near-real-time processing of JSON/XML files. Files landed in S3 → S3 Event Notification triggered an SQS message → The Play app consumed messages, parsed metadata, performed upserts into RDS tables, and wrote processed data to S3 for downstream consumption."),
      para("This setup became a maintainability challenge, and as part of tech unification we migrated to PySpark Structured Streaming on Databricks."),
      subHeading("What We Did"),
      bullet("Rebuilt entire logic as a Spark Streaming job reading from the same SQS queue using Databricks' Auto Loader SQS connector"),
      bullet("Used PySpark for parsing complex nested JSON/XML, applying transformations, and performing upserts to RDS tables"),
      bullet("Output written to Silver layer S3 in optimized formats for downstream jobs"),
      subHeading("Key Decisions & Trade-offs"),
      para("Initially kept as a streaming job to maintain near-real-time behavior. However, after analyzing latency requirements with stakeholders, we realized hourly batch processing would be sufficient for most use cases. This allowed us to significantly reduce cost and complexity."),
      subHeading("Results"),
      bullet("Much more maintainable, scalable, and observable (thanks to Spark UI and Databricks monitoring)"),
      bullet("Eliminated the need to manage EC2 instances under Elastic Beanstalk"),
      bullet("Reduced operational overhead significantly"),
      subHeading("Follow-up: Why Databricks over Java/Scala Spark on EMR?"),
      bullet("Better PySpark support and developer productivity"),
      bullet("Excellent Delta Lake integration for reliable upserts"),
      bullet("Avoids small files problems with more efficient storage design"),
    ]
  },
  {
    num: 5,
    q: "Tell me about a time you reprocessed huge volumes of historic data",
    kw: "backfill, dual write, zero downtime, shadow table, atomic cutover, Delta Lake",
    content: [
      subHeading("Context"),
      para("During migration from the legacy Java Play application to the PySpark + Databricks pipeline, we needed to reprocess historic data with no downtime or data loss. The new pipeline had a completely different output schema and partitioning strategy."),
      subHeading("Strategy: Backfill + Dual Write + Cutover (Zero Downtime)"),
      boldPara("1. Backfill Phase (Incremental & Parallel): ", "Created a shadow table with the new schema, partitioning, and Z-ordering. Split historic data into monthly batches and ran PySpark jobs with date filters for efficient partition pruning. Wrote to Delta table using append mode with schema evolution enabled."),
      boldPara("2. Dual-Write Cutover: ", "Once backfill reached the latest data, enabled dual write in production streaming job — new incoming data was written to both the old table and the new shadow table. Ran for 7 days to validate live data in parallel."),
      boldPara("3. Validation & Reconciliation: ", "Built validation notebooks using custom PySpark queries comparing row counts, aggregations (sum of metrics, distinct device_ids), and sampled records between old and new tables."),
      boldPara("4. Atomic Cutover: ", "Once validation passed with 100% match on key metrics — renamed old table to _old (instant metadata operation), renamed new shadow table to production name, dropped old table only after 30 days."),
      para("This taught the importance of shadow tables, dual writes, and rigorous validation when dealing with petabyte-scale cutovers."),
    ]
  },
  {
    num: 6,
    q: "How do you load huge volumes of data into Databricks?",
    kw: "Auto Loader, S3 Event Notifications, SQS, small files, checkpointing, OPTIMIZE, Liquid Clustering",
    content: [
      italic("Scenario: S3 data lake with 5TB of JSON data arriving daily. spark.read.json() is not performant enough — jobs are getting progressively slower."),
      subHeading("The Problem"),
      para("When you run spark.read.json() against millions of files in S3, Spark must first LIST the entire S3 bucket to discover all files before processing. At 5TB daily, this quickly becomes the single biggest bottleneck. The LIST API call to S3 is expensive both in latency and cost — this is the 'small files problem' in terms of file count and metadata overhead."),
      subHeading("Solution: Databricks Auto Loader"),
      boldPara("File Notification Mode (S3 + SQS): ", "Instead of listing the bucket on every run, Auto Loader integrates with S3 Event Notifications and AWS SQS. When a new file lands, an event is pushed to SQS — Auto Loader consumes from the queue, eliminating LIST API calls."),
      boldPara("Schema Evolution & Rescue Data: ", "Auto Loader automatically infers and evolves schemas. If a new field appears in the JSON payload, it does not fail the job. Unmatched or malformed data is stored in a hidden _rescue_data column."),
      boldPara("Checkpointing: ", "Auto Loader writes a checkpoint to a configurable location. On re-run, it resumes from exactly where it left off — no duplicate processing, no missed files."),
      subHeading("Post-Ingestion Optimizations"),
      bullet("Columnar format (Parquet/Delta): JSON is row-oriented and uncompressed. Delta Lake stores data in Parquet — columnar, compressed, and orders of magnitude faster for analytical queries."),
      bullet("Partition pruning: Partition the table by date."),
      bullet("Avoid small files: Run OPTIMIZE on Delta table to compact files."),
      bullet("Liquid Clustering (Z-Order): For high-cardinality filter columns, apply ZORDER via OPTIMIZE ... ZORDER BY or enable Liquid Clustering."),
      bullet("VACUUM: Run regularly to clean up old file versions and reclaim storage."),
    ]
  },
  {
    num: 7,
    q: "How do you address the Late Arrival & Reprocessing dilemma?",
    kw: "MERGE INTO, late-arriving data, idempotency, Delta Lake, CDF, partition pruning",
    content: [
      italic("Scenario: Silver Delta table partitioned by event_date. Monday's data goes missing due to source failure and only arrives Wednesday. Monday's partition is already 'complete' and being read by downstream systems."),
      subHeading("Why Naive Approaches Fail"),
      bullet("INSERT → Creates duplicates"),
      bullet("INSERT OVERWRITE → Physically replaces entire partition, wiping out correctly written records"),
      subHeading("Correct Solution: Idempotent MERGE INTO"),
      para("Delta Lake's MERGE INTO is specifically designed for this scenario. It compares incoming records against existing records on a key and only inserts rows that don't already exist or updates rows that have changed. Because the Silver table is partitioned by event_date, the merge automatically prunes to Monday's partition — it does not scan the entire table."),
      subHeading("Implementation"),
      para("Load late data with filter on event_date = '2024-01-01', then:"),
      bullet("MERGE INTO silver.events t USING late_data_tbl s ON t.event_id = s.event_id AND t.event_date = s.event_date"),
      bullet("WHEN NOT MATCHED THEN INSERT *"),
      bullet("WHEN MATCHED THEN UPDATE SET * (for any updates)"),
      subHeading("Additional Considerations"),
      bullet("Predictive Optimization: In Databricks, can automatically run OPTIMIZE and VACUUM after MERGE operations."),
      bullet("Full partition replacement: Use 'overwrite' mode for atomic full-partition replacement."),
      bullet("Change Data Feed (CDF): Enable CDF on the Silver table so downstream consumers can query only the changes (inserts, updates) rather than re-reading the full partition."),
      bullet("SLA & alerting: Track late arrival metrics. If data for date D hasn't arrived within N hours, fire an alert."),
    ]
  },
  {
    num: 8,
    q: "How do you diagnose and fix a slow Spark pipeline?",
    kw: "Spark UI, data skew, shuffle, GC, broadcast join, AQE, predicate pushdown, spill to disk",
    content: [
      italic("Scenario: A Spark pipeline that used to complete in 45 minutes is now taking 3+ hours. You are on-call."),
      subHeading("Step 1: Compare Slow vs Fast Run Statistics"),
      para("Open the Spark UI or Databricks Job Run History and look at the most recent fast run versus today's slow run. Key metrics:"),
      bullet("Any change in data volume?"),
      bullet("Any recent code changes, library upgrades, or config changes?"),
      bullet("Total job duration and per-stage duration"),
      bullet("Total tasks and input/output data volume"),
      subHeading("Step 2: Spark UI Deep-Dive"),
      bullet("Jobs & Stages tab: Find long-running stages. Look at median vs max task duration — a large gap indicates data skew."),
      bullet("Executors tab: Check cores and memory usage. High GC time means executors are memory-pressured. Non-zero shuffle spill means shuffle partitions are too small."),
      bullet("SQL / Physical Plan tab: Look for SortMergeJoin where BroadcastHashJoin should be used, missing partition pruning, or full table scans where predicate pushdown should apply."),
      subHeading("Common Bottlenecks & Fixes"),
      makeTable(
        ["Bottleneck", "Diagnosis", "Fix"],
        [
          ["Data Skew", "Few tasks take 10x longer than median", "Apply salting, enable AQE skew join"],
          ["Shuffle Explosion", "Massive shuffle read/write on groupBy", "Increase shuffle partitions (target 128–256MB/partition)"],
          ["Small Files", "Too many tasks with minimal work", "Run OPTIMIZE, adjust partition pruning"],
          ["Spill to Disk", "High shuffle spill bytes in Spark UI", "Increase executor memory, use off-heap memory"],
          ["Wrong Join Strategy", "SortMergeJoin on a small table", "Force broadcast join or increase broadcast threshold"],
          ["Cluster Contention", "Low utilization, many PENDING tasks", "Resize cluster or adjust autoscale min/max"],
        ],
        [2500, 3060, 3800]
      ),
    ]
  },
  {
    num: 9,
    q: "How do you migrate a Data Lake to a Data Warehouse?",
    kw: "S3, Hive metastore, Delta Lake, COPY INTO, MERGE INTO, dual-write, validation, cutover",
    content: [
      italic("Scenario: Organisation has years of data in an S3-based Data Lake (Parquet/JSON, Hive metastore). Leadership decided to migrate to a cloud Data Warehouse (Databricks Lakehouse, Snowflake, or Redshift)."),
      subHeading("Phase 1 — Discovery & Scoping"),
      bullet("Identify tables and datasets: Prioritize by business criticality. Some archive tables may be better as external tables."),
      bullet("Understand data characteristics: Document volume, velocity, format, schema complexity, and access patterns per table."),
      bullet("Define success criteria: Row counts match, key aggregations match, query performance meets SLA."),
      bullet("Migration strategy: Migrate full historical data first → switch to ongoing incremental sync → run both systems in parallel → cut over."),
      subHeading("Phase 2 — Data Profiling"),
      bullet("Schema documentation: Use AWS Glue Data Catalog or Databricks Unity Catalog to inventory all schemas."),
      bullet("Data quality assessment: Profile each table for null rates, duplicate keys, out-of-range values. Fix critical issues before migration."),
      subHeading("Phase 3 — Schema Design & Mapping"),
      bullet("Design warehouse schema for query performance. Normalize where it reduces redundancy; denormalize where it speeds common joins."),
      bullet("Apply clustering/Z-ordering on high-cardinality filter columns in the target."),
      bullet("Decide: full internal copy (best performance, higher cost) vs external table pointing at the lake."),
      subHeading("Phase 4 — Incremental & Historical Data Loading"),
      bullet("COPY INTO for historical loads: Optimized for bulk loading from S3/ADLS into Delta tables. Idempotent — no duplicates on re-runs."),
      bullet("MERGE INTO for incremental/CDC: For tables that continue to receive updates."),
      bullet("Spark Structured Streaming: For tables with continuous incoming data, ensures the target stays in sync during the migration window."),
      bullet("Dual-write / Blue-Green strategy: Write new data to both old lake and new warehouse. Ensures roll-back capability if issues arise."),
      bullet("Validation gates: After each table migration, run automated validation."),
      bullet("Cutover: Redirect all read/write traffic to warehouse. Keep the lake in read-only mode for a defined period."),
    ]
  },
  {
    num: 10,
    q: "How do you handle data quality issues in a production pipeline?",
    kw: "DQ framework, medallion architecture, PyDeequ, Great Expectations, DLT constraints, quarantine",
    content: [
      italic("Scenario: Upstream APIs producing duplicate records and null values in key columns causing incorrect metrics on Gold tables feeding executive dashboards and ML models."),
      para("There should be a DQ framework in place to catch bad data as early as possible. Every layer of the Medallion architecture should have DQ checks appropriate to its role:"),
      bullet("Bronze: Accept all data but validate structural integrity. Log structural failures to a dead-letter table. Quarantine bad data."),
      bullet("Silver: Core DQ rules apply — nulls in business-critical columns, duplicate event IDs, out-of-range values, format validity."),
      bullet("Gold: Validate business logic — do daily totals match expected ranges, etc."),
      subHeading("DQ Framework: Six Dimensions"),
      makeTable(
        ["Dimension", "Definition", "Example Check"],
        [
          ["Completeness", "Required fields must not be null", "device_id IS NOT NULL"],
          ["Consistency", "Data consistent across related fields/tables", "status matches allowed values"],
          ["Validity", "Values conform to defined formats/ranges", "age BETWEEN 0 AND 150"],
          ["Uniqueness", "Business keys unique within scope", "event_id has no duplicates"],
          ["Timeliness", "Data arrives within expected window", "ingest_ts - event_ts < 2 hours"],
          ["Accuracy", "Correctly represents real-world entity", "Compare against trusted reference source"],
        ],
        [2200, 3780, 3380]
      ),
      subHeading("Implementation: Delta Live Tables Declarative DQ"),
      para("@dlt.expect_or_quarantine('valid_event_id', 'event_id IS NOT NULL') — sends failing records to quarantine table."),
      para("@dlt.expect_or_drop('valid_price', 'price >= 0') — silently drops failing records."),
      para("@dlt.expect_or_fail — halts the pipeline for critical violations."),
      subHeading("Key Best Practices"),
      bullet("Idempotent pipelines: Design every stage so it can be re-run safely."),
      bullet("Version DQ rules as code: DQ rules should be in Git alongside pipeline code."),
      bullet("Review quarantined data: Periodic review, automatic alerting, and RCA for issues."),
      bullet("Log DQ statistics on every run: records processed, records quarantined, pass rate per rule. Alert if bad data threshold is exceeded."),
    ]
  },
  {
    num: 11,
    q: "What is your failure recovery plan for a critical ETL pipeline failure?",
    kw: "2 AM on-call, Delta RESTORE, idempotency, root cause fix, SLA recovery, downstream pause",
    content: [
      italic("Scenario: 2:00 AM — critical ETL pipeline feeding the daily executive dashboard failed halfway through processing. Incomplete data written to Silver table. Downstream jobs queued and waiting."),
      subHeading("Step 1: Immediate Response"),
      bullet("Pause downstream jobs: Immediately pause or cancel all dependent jobs to prevent propagation of incomplete data."),
      bullet("Failure assessment: Check Spark UI for the failed job — examine the failed stage, error messages. Key questions: Did it fail on read, transformation, or write? Was the write partially committed? Check Delta Lake transaction logs."),
      bullet("Communicate: Send a quick status update to stakeholders with estimated recovery time. Ideally automated on failure via alerting system."),
      subHeading("Step 2: Recovery — Idempotency and Replay"),
      bullet("Delete partial writes: Delta Lake's transaction log makes this clean. Use RESTORE command to roll back to a known good state."),
      bullet("Alternatively, if partial records can be identified, use DELETE with a WHERE clause."),
      subHeading("Step 3: Fix the Root Cause"),
      bullet("Data Skew: Apply salting on the skewed key or enable AQE with skew join optimization. Increase executor memory as a short-term fix."),
      bullet("Out of Memory (OOM): Increase executor memory and memoryOverhead. Increase shuffle partitions to reduce per-partition data size."),
      bullet("Schema drift: Add the new field to schema definition or enable schema evolution on the Delta table (mergeSchema = true)."),
      bullet("Source data issue: File a bug with the upstream team and potentially reprocess from the quarantine table."),
      subHeading("Step 4: Re-run and Validate"),
      bullet("Re-run idempotently: Fix the root cause, then re-run. Use mode('overwrite') with option('replaceWhere', ...) scoped to the specific date partition."),
      bullet("Validate before re-enabling downstream: Run standard DQ checks against the recovered output."),
      bullet("Re-enable downstream: Only after validation passes."),
    ]
  },
  {
    num: 12,
    q: "How do you scale a daily batch process to meet SLA?",
    kw: "Spark UI, data skew, shuffle partitions, AQE, Z-ordering, bucket join, incremental processing",
    content: [
      italic("Scenario: Daily batch job must complete by 07:00 UTC. Currently running 30 minutes over SLA. Data volume growing 20% month-on-month."),
      subHeading("Step 1: Identify the Bottleneck First"),
      para("Never add resources or rewrite code without identifying the actual bottleneck. Adding executors to a skewed job doesn't help the skewed tasks."),
      bullet("Spark UI → Stages tab: Find the slowest stage. Check for skew (max task >> median), high shuffle read/write, GC time, spill to disk."),
      bullet("Data volume check: Has input data grown faster than expected? If a stage that processed 500GB now processes 900GB, this may simply be a scaling problem."),
      bullet("File count check: Is the small files problem getting worse? 500,000 files of 1MB each spends more time on task scheduling than actual processing."),
      subHeading("Quick Fixes"),
      bullet("AQE: Enable spark.sql.adaptive.enabled=true. Dynamically coalesces shuffle partitions, switches join strategies, handles skew joins automatically."),
      bullet("Shuffle partition tuning: Target 128MB–256MB per partition. If shuffle data is 2TB, you need ~8,000–16,000 shuffle partitions."),
      bullet("Broadcast join: Force or increase threshold for small table joins."),
      bullet("Predicate pushdown: Ensure filters on partition columns are applied before joins."),
      subHeading("Long-Term Structural Changes"),
      bullet("Partition by high-cardinality, frequently-filtered columns: If the job always filters by region and date, partition the table by both."),
      bullet("Bucket tables on join keys: If the same two large tables are joined on the same key every run, bucket both — this eliminates the shuffle entirely."),
      bullet("Liquid Clustering: Replace static partitioning with Liquid Clustering on the most common filter columns."),
      bullet("File size optimisation: Run OPTIMIZE regularly to compact small files to 128–512MB. Schedule VACUUM to clean up stale versions."),
      bullet("Incremental processing: Replace full table reloads with Delta Lake MERGE-based incremental updates. Process only yesterday's new/changed records."),
      bullet("Cluster reconfiguration: Right-size the cluster for the workload — consider fixed-size clusters for SLA-bound jobs."),
    ]
  },
  {
    num: 13,
    q: "Corrupted files appear in S3 every morning — how do you prevent pipeline failure?",
    kw: "Auto Loader, rescue data, schema enforcement, dead letter queue, quarantine, SNS alerting",
    content: [
      italic("Scenario: Each morning, some files in the S3 landing zone are corrupted, truncated, or have unexpected schemas, causing ingestion pipeline failure and blocking all downstream processing."),
      subHeading("Core Principle: Safe Landing Design"),
      italic("Ingest everything, fail nothing, quarantine the bad, alert on anomalies."),
      subHeading("Solution 1: Auto Loader with Rescue Data"),
      para("When Auto Loader encounters a record that doesn't match the expected schema, instead of throwing an exception, it stores the entire raw record in a special _rescue_data column as a string. The pipeline continues processing all valid records."),
      para("Use .option('rescuedDataColumn', '_rescue_data') and .option('cloudFiles.schemaEvolutionMode', 'rescue'). A downstream DQ check on _rescue_data IS NOT NULL will identify all records that needed rescuing."),
      subHeading("Solution 2: Auto Loader with Schema Enforcement"),
      para("Enable FAILONNEWCOLUMNS mode for strict schema validation. Files that completely fail to parse can be routed to a bad files path rather than failing the stream:"),
      bullet(".option('cloudFiles.schemaEvolutionMode', 'failOnNewColumns')"),
      bullet(".option('badRecordsPath', 's3://bucket/quarantine/bad_records/')"),
      subHeading("Alerting & Notification"),
      bullet("Databricks Alerts: Set up an alert on a query checking quarantine table record counts. If bad record count exceeds a threshold in the last hour, trigger an alert."),
      bullet("SNS trigger: For file-level failures detected by Lambda, publish to an SNS topic that emails or pages the on-call engineer with the S3 path, file name, and error type."),
      bullet("Schema drift alerting: Monitor Auto Loader's schema evolution log for schema changes; alert when unexpected schema evolution occurs."),
    ]
  },
  {
    num: 14,
    q: "You have hundreds of GBs of data arriving daily — how do you configure your cluster and plan the batch job?",
    kw: "cluster sizing, fixed vs autoscale, shuffle partitions, memory-optimized instances, batch phases",
    content: [
      subHeading("Step 1: Understand the Workload Profile First"),
      bullet("Data Characteristics: Exact volume? Format? How many files? Consistent schema?"),
      bullet("Job characteristics: What transformations? Are there joins? Any groupBy on high-cardinality keys (shuffle-heavy)? What is the SLA?"),
      subHeading("Step 2: Cluster Type — Fixed-Size for SLA-Bound Jobs"),
      para("For a daily batch with a hard SLA, always prefer a fixed-size cluster over autoscale. Autoscale looks attractive on cost, but nodes spinning up mid-job introduce unpredictable latency that can breach your SLA window."),
      subHeading("Step 3: Cluster Sizing"),
      bullet("Estimate shuffle volume: Daily input size (GB) × shuffle factor (0.3–0.6)"),
      bullet("Calculate target partitions: Target partition size = 256 MB; Partitions = (Shuffle volume in MB) / 256"),
      bullet("Cores needed: With AQE + Auto Loader, 4–6 partitions per core is safe and efficient; Cores = Partitions / 5"),
      bullet("Choose instance type: Preferred r6i.4xlarge or i3.4xlarge → 16 cores, 122 GB RAM → gives ~6–7 GB memory per core (ideal for shuffles)"),
      bullet("Workers = ceil(Cores / 16); Add autoscaling: min = 40–50% of max, max = calculated workers + 20% buffer"),
      subHeading("Step 4: Plan the Job — Processing Phases"),
      bullet("Phase 1 — Safe Ingest into Bronze: Use Auto Loader with trigger(availableNow=True) — processes all files since last checkpoint in one batch, then terminates."),
      bullet("Phase 2 — Filter & Validate into Silver: Apply partition pruning immediately — filter to ingest_date = today before any joins or transforms."),
      bullet("Phase 3 — Transform & Enrich: Broadcast small lookup/dimension tables (< 8–10GB). Cache any DataFrame reused more than once. Avoid Python UDFs — use native Spark SQL functions (10–20× faster)."),
      bullet("Phase 4 — Aggregate & Write to Gold: Use repartition() before writing to control output file sizes. Target 128MB–512MB per file."),
      bullet("Phase 5 — Post-processing: Run OPTIMIZE and VACUUM commands after significant writes."),
    ]
  },
  {
    num: 15,
    q: "How would you handle schema changes in a big table with real-time data flowing in?",
    kw: "shadow table, dual write, schema evolution, atomic cutover, online DDL, MERGE, Delta Lake time travel",
    content: [
      subHeading("Planning & Risk Assessment"),
      bullet("Analyze the type of change: Safe (adding nullable column) / Moderate (renaming column) / Complex (changing data type, new primary key)"),
      bullet("Identify dependent systems — upstream pipelines, consumers, dashboards"),
      bullet("Table statistics: size, write throughput, and peak ingestion rate"),
      bullet("Define validation criteria and a full rollback plan"),
      subHeading("Choose the Appropriate Strategy"),
      boldPara("Simple/Safe changes: ", "Use native 'Online DDL' features such as ALTER TABLE ... LOCK=NONE. Some data inconsistency might happen."),
      boldPara("Moderate/Complex changes: ", "Use the Shadow Table + Dual Write pattern — the most reliable method for production."),
      subHeading("Shadow Table + Dual-Write Approach"),
      bullet("Create a new table with the updated schema"),
      bullet("Modify the real-time ingestion job to dual-write all new incoming data to both old and new tables"),
      bullet("Run a parallel backfill job to migrate historical data in batches"),
      bullet("For Delta Lake: Leverage schema evolution + mergeSchema during backfill (Automerge)"),
      bullet("For relational DBs: Use selective updates or COPY from S3 for efficiency"),
      subHeading("Validation Phase"),
      bullet("Run automated validation jobs comparing: row counts, column-level checksums, business metrics (e.g., total ink usage, active devices), and sample record validation"),
      bullet("Keep dual-write running for 3–7 days to validate live traffic"),
      bullet("Use Delta Lake Time Travel or database snapshots for point-in-time comparison"),
      subHeading("Atomic Cutover"),
      bullet("Rename old table → table_name_old (instant metadata operation)"),
      bullet("Rename new table → table_name (production)"),
      bullet("Keep old table for 15–30 days as safety net; disable dual-write"),
      bullet("After safe period: drop old table, run OPTIMIZE/ANALYZE, monitor ingestion latency for at least one week post-cutover"),
    ]
  },
  {
    num: 16,
    q: "How do you approach testing in your data pipelines?",
    kw: "pytest, PyDeequ, Great Expectations, CI/CD, unit testing, integration testing, data validation",
    content: [
      para("Testing is extremely important in data engineering because bad data can silently break downstream analytics, ML models, and business decisions. I follow a multi-layered testing strategy — unit testing, integration testing, and data quality testing."),
      subHeading("Unit Testing (pytest)"),
      bullet("Use pytest framework for testing individual components"),
      bullet("Mock small DataFrames so you can test business logic without needing a live cluster"),
      bullet("Validate logic like expected query results, counts, etc. and assert with expected outputs"),
      bullet("Aim for >80% code coverage"),
      subHeading("Data Quality & Validation Testing"),
      boldPara("PyDeequ: ", "Great for writing declarative tests on Spark DataFrames — checking completeness, uniqueness, value ranges, and anomaly detection. E.g., 'device_id should never be null' or 'ink values must be between 0 and 150.'"),
      boldPara("Great Expectations (GE): ", "One of the best tools available. Creates expectation suites that act as living documentation and can be run both in development and in CI/CD pipelines. Excellent reporting and Databricks integration."),
      subHeading("Integration & End-to-End Testing"),
      bullet("Run integration tests on a smaller representative dataset (e.g., one day's data) in a dev workspace"),
      bullet("Perform backfill validation by comparing output of the new pipeline with the legacy system during migration"),
      bullet("Maintain a test-case sheet capturing test scenarios and results in Git alongside the code"),
      subHeading("CI/CD Integration"),
      bullet("All tests integrated into CI/CD pipeline (Jenkins/Codeway) — any code change must pass all unit and data quality tests before merging"),
    ]
  },
  {
    num: 17,
    q: "What is the toughest thing you find about being a data engineer?",
    kw: "data quality at scale, legacy systems, Spark optimization, stakeholder management, SLAs",
    content: [
      para("There are multiple challenges being a data engineer covering not just data pipeline development but also operational activities:"),
      subHeading("1. Speed vs Quality Tension"),
      para("Managing the tension between speed of delivery and maintaining system reliability and data quality at scale. Stakeholders often want new features in short sprints, but rushing can easily introduce schema drift, duplicates, or bad data. I had to continuously balance this by implementing strong data quality checks while still meeting aggressive timelines."),
      subHeading("2. Legacy System Maintenance"),
      para("Handling legacy system maintenance and scalability issues while simultaneously building the new Databricks platform. The old Java Play Framework application was brittle and hard to scale. When the pipeline failed, it created a huge backlog of data. The system was decoupled using SQS queues, which successfully prevented data loss, but then we had to rapidly scale up clusters to clear the backlog without impacting cost or SLAs."),
      subHeading("3. Ongoing Spark Optimization"),
      para("Optimizing Spark pipelines for performance and cost is a constant challenge. Things like data skew, inefficient joins, small file problems, and choosing the right partitioning strategy can significantly impact runtime and cloud spend."),
      subHeading("How I Address These Challenges"),
      bullet("Automation for monitoring and self-healing pipelines"),
      bullet("Modular pipeline design with clear boundaries"),
      bullet("Close collaboration with business teams to align on priorities"),
      bullet("Proactive technical debt management — allocating 20% of sprint capacity to platform improvements"),
      para("These experiences — especially achieving ~$300k annual cost savings through careful optimization — have been the most rewarding part of the role."),
    ]
  },
  {
    num: 18,
    q: "Why do every data system requires a disaster recovery plan?",
    kw: "RPO, RTO, backup, replication, failover, DR drills, business continuity",
    content: [
      para("A disaster recovery plan ensures that data systems can be restored and continue to operate in the event of a cyber-attack, hardware failure, natural disaster, or other catastrophic events. Key pillars:"),
      subHeading("Core Components"),
      bullet("Real-time backup: Regularly backing up files and databases to secure, offsite storage locations. Consider RPO (Recovery Point Objective) — how much data loss is acceptable?"),
      bullet("Data redundancy: Implementing data replication across different geographical locations to ensure availability. Multi-region S3 replication, cross-AZ RDS replicas."),
      bullet("Security protocols: Establishing protocols to monitor, trace, and restrict both incoming and outgoing traffic to prevent data breaches."),
      bullet("Recovery procedures: Detailed procedures for restoring data and systems quickly and efficiently to minimize downtime. Consider RTO (Recovery Time Objective) — how quickly must the system be restored?"),
      bullet("Testing and drills: Regularly testing the DR plan through simulations to ensure its effectiveness and make necessary adjustments."),
      subHeading("Data Engineering Specific Considerations"),
      bullet("Delta Lake Time Travel: Provides point-in-time restoration of data without a full backup/restore cycle."),
      bullet("Idempotent pipelines: If a pipeline can be safely re-run, recovery from a failure is just a matter of re-triggering the job."),
      bullet("Checkpointing: Auto Loader and Structured Streaming checkpoints enable exact-resume from failure point."),
      bullet("Multi-region deployment: For mission-critical pipelines, deploy compute and storage in multiple AWS regions."),
    ]
  },
  {
    num: 19,
    q: "How do companies like Meta, Instagram, or Reddit store and handle big data at their scale?",
    kw: "Meta, Reddit, Kafka, Flink, Iceberg, Presto, Cassandra, petabyte scale, lakehouse",
    content: [
      subHeading("Meta (Facebook & Instagram)"),
      para("Meta processes hundreds of petabytes of data. They use a Lakehouse architecture with massive S3-compatible object storage. On top of that, they heavily use Apache Iceberg as the table format for ACID transactions, schema evolution, and reliability at petabyte scale."),
      bullet("Real-time: Kafka at enormous scale for event streaming; Flink and Spark Streaming for real-time analytics"),
      bullet("Custom systems: Scuba (real-time OLAP database) and TAO (distributed graph database) for social graph and feed queries"),
      bullet("Interactive queries: Presto/Trino for fast interactive SQL queries across the data lake"),
      bullet("Custom hardware: Hyperscale data centers and massive GPU clusters for training recommendation models"),
      subHeading("Reddit"),
      bullet("Cassandra: Primary database for high-velocity write workloads (posts, comments, votes)"),
      bullet("Kafka: Central event bus"),
      bullet("Spark: Batch processing and analytics"),
      bullet("PostgreSQL (heavily sharded): Relational data where strong consistency is required"),
      bullet("S3 + Iceberg/Hive: Data lake"),
      subHeading("Common Design Patterns"),
      makeTable(
        ["Pattern", "Description"],
        [
          ["Decoupling", "Separate storage from compute using object storage + open table formats"],
          ["Event-Driven Architecture", "Almost everything flows through Kafka"],
          ["Eventual Consistency", "Prioritize availability and scale over immediate strong consistency"],
          ["Horizontal Scaling", "Everything designed to scale out by adding more nodes"],
          ["Lakehouse Approach", "Moving away from traditional warehouses toward Iceberg + S3"],
        ],
        [2800, 6560]
      ),
    ]
  },
  {
    num: 20,
    q: "When do you choose SQL versus NoSQL databases?",
    kw: "ACID, relational, Cassandra, DynamoDB, MongoDB, polyglot persistence, CAP theorem",
    content: [
      para("I choose between SQL and NoSQL databases based on the use case, access patterns, scalability needs, and consistency requirements — not based on hype or personal preference."),
      subHeading("When I Choose SQL (Relational Databases)"),
      bullet("Strong consistency and ACID transactions are required (e.g., financial systems, order management, user accounts)"),
      bullet("The data has complex relationships and needs frequent joins"),
      bullet("The schema is well-defined and stable"),
      bullet("I need powerful querying capabilities with aggregations, window functions, and complex business logic"),
      para("Examples: MySQL, PostgreSQL, Amazon RDS/Redshift."),
      subHeading("When I Choose NoSQL Databases"),
      bullet("High write throughput and massive scalability needed"),
      bullet("Data is semi-structured or unstructured (JSON, logs, events)"),
      bullet("Access pattern is mostly key-based lookups or simple queries (no heavy joins)"),
      bullet("Schema flexibility is important because the data model evolves rapidly"),
      bullet("High availability and horizontal scaling with eventual consistency"),
      makeTable(
        ["NoSQL Type", "Product", "Best For"],
        [
          ["Wide Column", "Cassandra / DynamoDB", "High-velocity time-series or user activity data"],
          ["Document", "MongoDB", "Document-heavy use cases"],
          ["Graph", "Neo4j", "Graph relationships (social networks, recommendations)"],
          ["In-Memory", "Redis", "Caching, session management, leaderboards"],
        ],
        [2200, 2760, 4400]
      ),
      subHeading("Decision Framework"),
      bullet("Transactional + Complex Queries → SQL (PostgreSQL / MySQL)"),
      bullet("High Velocity + Simple Access → NoSQL (Cassandra / DynamoDB)"),
      bullet("Real-time Analytics → Often a combination (Kafka → Spark → Iceberg)"),
      bullet("Hybrid Needs → Polyglot persistence (multiple databases for different purposes)"),
    ]
  },
  {
    num: 21,
    q: "How do you consider operational costs during data pipeline development?",
    kw: "engineer time, technical debt, on-call burden, idempotency, modular design, documentation",
    content: [
      para("Operational costs for data pipelines extend far beyond compute and storage — they include the hidden costs of engineer time, manual processes, and technical debt accumulation:"),
      bullet("Engineer time spent on maintenance, debugging, and incident response"),
      bullet("Manual processes and rework"),
      bullet("Knowledge transfer and team ramp-up time"),
      bullet("Technical debt accumulation"),
      bullet("On-call burden"),
      subHeading("How I Minimize Operational Costs"),
      boldPara("Modular & Observable Design: ", "Design pipelines with clear boundaries, proper logging, and structured monitoring so that when something breaks, we can identify the root cause in minutes instead of hours."),
      boldPara("Automation First: ", "Invest time upfront in automated data quality checks (PyDeequ + Great Expectations), alerts, and self-healing mechanisms so the pipeline requires minimal manual intervention."),
      boldPara("Idempotency & Reprocessability: ", "Every job I build can be safely re-run without duplicating data. This drastically reduces recovery time during failures."),
      boldPara("Documentation & Knowledge Sharing: ", "Maintain clear runbooks, data lineage, and pipeline diagrams so new team members or other teams can support the pipeline without heavy dependency on the original developer."),
      boldPara("Choosing the Right Tool: ", "Avoid overly complex solutions that look good on paper but create high maintenance overhead."),
      subHeading("Cost Estimation During Planning"),
      bullet("Estimate compute costs before building — run cost calculations for different cluster configurations"),
      bullet("Consider API costs (S3 LIST operations, GET/PUT counts) that can add up quickly"),
      bullet("Evaluate managed services vs self-managed for total cost of ownership"),
    ]
  },
  {
    num: 22,
    q: "Design an end-to-end data platform for a company generating 5 TB of data per day",
    kw: "Lakehouse, Medallion, Auto Loader, Kinesis, Kafka, AQE, DLT, monitoring, cost management",
    content: [
      subHeading("1. Ingestion Layer: Decoupled & Event-Driven"),
      bullet("Real-Time Stream: For low-latency requirements (e.g., real-time monitoring) → data flows through Amazon Kinesis or Kafka"),
      bullet("Batch/Micro-Batch Landing: For bulk of 5 TB (structured and unstructured) → S3 as landing zone"),
      bullet("Auto Loader (File Notification Mode): Uses S3 Event Notifications + SQS to ingest files incrementally, eliminating O(n) latency of S3 LIST expensive API calls"),
      subHeading("2. Storage: The Lakehouse Foundation (Medallion Architecture on Delta Lake)"),
      bullet("Bronze (Raw): Ingest with Schema Evolution and Rescue Data enabled. Malformed records captured in _rescue_data column rather than failing ingestion."),
      bullet("Silver (Cleansed): MERGE INTO with predicate pushdown on partition columns (e.g., event_date) for idempotent deduplication without full scan."),
      bullet("Gold (Curated): Optimized for consumption. Apply Liquid Clustering or Z-Ordering on high-cardinality keys like device_id."),
      subHeading("3. Compute & Performance Optimization"),
      bullet("Cluster Sizing: Fixed-size clusters for SLA-bound batch jobs (avoid autoscale spin-up latency). Memory-optimized instances providing ~6–7 GB RAM per core."),
      bullet("AQE: Enable to allow Spark to dynamically coalesce shuffle partitions and switch join strategies at runtime."),
      bullet("Shuffle Tuning: With 5 TB, default 200 shuffle partitions will cause spill to disk. Target 128MB–256MB per partition → likely 10,000+ shuffle partitions for large stages."),
      subHeading("4. Governance & Reliability"),
      bullet("Data Quality: Embed DQ Framework using Delta Live Tables expectations. Automatically quarantine bad data without stopping the flow."),
      bullet("Monitoring: SLI/SLO tracking via Databricks Request API and Grafana. Monitor ingestion latency (time from S3 landing to Silver) and data completeness."),
      bullet("Orchestration: Databricks Workflows for Spark-heavy pipelines; Airflow for cross-system orchestration."),
      subHeading("5. Cost Management"),
      bullet("S3 Lifecycle Policies: Transition aged Bronze data to Glacier after compaction."),
      bullet("VACUUM and OPTIMIZE: Run regularly to reclaim storage and improve I/O."),
      bullet("Spot Instances: Use 80% spot + 20% on-demand for ETL jobs."),
      bullet("Serverless SQL Warehouses: For ad-hoc analyst queries to avoid always-on cluster costs."),
    ]
  },
  {
    num: 23,
    q: "How would you design a scalable, reliable ingestion pipeline for both structured and unstructured data?",
    kw: "Auto Loader, binaryFile mode, OCR, ML models, schema-on-read, backpressure, SQS/SNS",
    content: [
      para("Design must focus on unified storage with decoupled processing paths. The goal is a format-agnostic 'Landing Zone'."),
      subHeading("1. The Landing Zone"),
      bullet("Storage: S3 or ADLS Gen2 as foundation. Directory structure separates data by source and arrival time."),
      bullet("Ingestion Engine: Databricks Auto Loader for structured data — uses 'Cloud Files' to infer schema and handle schema drift automatically."),
      bullet("For Unstructured Data: Auto Loader configured in binaryFile mode — captures file content as a byte array without attempting to parse."),
      subHeading("2. Processing Strategy: Medallion Approach"),
      boldPara("Bronze (Raw Archive): ", "Structured data loaded as-is into Delta tables. Unstructured data: metadata and binary content saved into a Delta table with the file path and ingestion timestamp."),
      boldPara("Silver (Transformation Phase): ", "Structured data: standard cleansing, normalization, and deduplication. Unstructured data: use UDFs or ML Models to 'structure' the unstructured — e.g., for images, use an OCR model to extract text; for audio, use Speech-to-Text."),
      boldPara("Gold (Unified View): ", "Structured attributes extracted from images/PDFs joined with native structured data. Creates a unified Feature Store or Business Reporting layer where analysts can query all data using standard SQL."),
      subHeading("3. Scalability & Reliability Considerations"),
      bullet("Backpressure Handling: Use Event-Driven trigger (SQS/SNS) so the pipeline doesn't poll storage. Even if 1 million files arrive at once, the pipeline scales elastically."),
      bullet("Idempotency: If a job fails halfway, re-running won't result in duplicate records — use Delta Lake's ACID transactions."),
      bullet("Data Integrity: Implement Expectations (DQ checks). For unstructured data, verify file size and extension match expectations."),
      subHeading("4. Trade-offs: Cost vs Latency"),
      bullet("For heavy unstructured processing (OCR/Video): Use GPU-enabled instances in the Silver layer only for specific notebooks to keep costs low."),
      bullet("Storage: Implement S3 Lifecycle policies — move raw binary data to Glacier while keeping extracted metadata in Delta for high-speed querying."),
    ]
  },
  {
    num: 24,
    q: "Walk me through implementing a Lakehouse architecture (Bronze-Silver-Gold) from scratch",
    kw: "Unity Catalog, Delta Lake, Auto Loader, schema enforcement, Liquid Clustering, idempotency, CI/CD",
    content: [
      para("It is not just about creating three folders in a data lake — it is about establishing a governance framework, an optimization strategy, and a scalable data contract between engineering and business."),
      subHeading("1. The Foundation: Unified Governance & Storage"),
      bullet("Storage: Deploy an Object Store (S3/ADLS) with a hierarchical structure"),
      bullet("Governance: Implement Unity Catalog (or a similar metastore) to ensure permissions, data lineage, and auditing are centralized from day one"),
      bullet("Format: Standardize on Delta Lake across all layers for ACID transactions, time travel, and schema enforcement"),
      subHeading("2. The Bronze Layer — 100% Data Fidelity"),
      bullet("Ingestion Strategy: Use Auto Loader (Cloud Files) for incremental loading"),
      bullet("Schema Policy: Schema Inference with Schema Evolution — creates _rescued_data column for unexpected fields"),
      bullet("Metadata: Append _ingestion_timestamp, _source_file_path, and _batch_id to every record for auditability"),
      subHeading("3. The Silver Layer — Clean, Queryable Entities"),
      bullet("Cleansing: Apply schema enforcement, cast data types, handle nulls based on business rules"),
      bullet("Deduplication: Use MERGE INTO operation (avoid expensive distinct() calls at scale)"),
      bullet("Data Quality: Implement DQ Constraints — failing critical checks diverts records to a Quarantine Table"),
      bullet("Modelling: Move from source structures to a denormalized or semi-normalized format"),
      subHeading("4. The Gold Layer — Business-Ready"),
      bullet("Aggregations & Logic: Apply complex business logic, calculations, or sessionization"),
      bullet("Liquid Clustering / Z-Ordering on frequently filtered columns (e.g., store_id, date)"),
      bullet("Data Compaction: Schedule regular OPTIMIZE and VACUUM to prevent small-file performance degradation"),
      bullet("Access Control: Use Row-Level Security (RLS) and Column-Level Masking"),
      subHeading("5. Operational Excellence"),
      bullet("Idempotency: Entire pipeline is idempotent — safe to re-run at any layer"),
      bullet("CI/CD & Observability: Every table definition stored as Code in Git"),
      bullet("Cost Efficiency: Serverless Compute for Gold layer BI queries; Spot Instances for Bronze/Silver batch processing (save up to 70%)"),
    ]
  },
  {
    num: 25,
    q: "Tell me about a time you influenced stakeholders or pushed back on a requirement",
    kw: "real-time vs batch, cost-benefit analysis, hourly micro-batch, stakeholder communication, Auto Loader",
    content: [
      subHeading("Situation"),
      para("We had a legacy application on the Play Framework (Java) that processed telemetry data in near real-time. As data volume scaled up, the legacy system became fragile. Stakeholders insisted that the new Databricks/PySpark implementation maintain sub-second latency."),
      subHeading("Task: Assessing the 'Real-Time' Tax"),
      para("I conducted an architectural audit and identified three major risks with maintaining true real-time processing in Spark:"),
      bullet("Infrastructure Cost: To handle large volume in a continuous stream with zero lag, we would need a large, always-on cluster, leading to a significant increase in cloud spend."),
      bullet("State Management Overhead: Maintaining state for deduplication and late-arriving data in a 24/7 stream increases the risk of checkpoint corruption."),
      bullet("The 'Last Mile' Reality: Downstream BI tools only refreshed their caches every hour. Providing sub-second data to a dashboard that refreshes every 60 minutes offered zero marginal value."),
      subHeading("Action: The Micro-Batch Solution"),
      bullet("Cost-Benefit Analysis: Demonstrated that hourly batch would allow Job Clusters (significantly cheaper than All-Purpose clusters) with Spot Instances."),
      bullet("Reliability through Idempotency: Explained that hourly batches are easier to reprocess. If a job fails, we simply re-run that hour's partition."),
      bullet("The Compromise: Implemented Auto Loader in Bronze layer — kept code 'Streaming-ready' but triggered hourly. This gave flexibility to increase frequency to 5 or 10 minutes in future without a code rewrite."),
      subHeading("Result"),
      bullet("Stakeholders approved the change once they saw the cost savings and realized 'Hourly Freshness' met 100% of their actual analytical needs"),
      bullet("The pipeline achieved high reliability — eliminated on-call fatigue from legacy streaming failures"),
      bullet("Utilized Spark's AQE during batch runs to optimize shuffles — far more effective in batch mode than continuous streaming"),
    ]
  },
  {
    num: 26,
    q: "How have you mentored junior data engineers or improved team processes?",
    kw: "code reviews, pair programming, pytest, design docs, runbooks, tribal knowledge, team processes",
    content: [
      subHeading("1. Improving Team Processes"),
      para("I noticed documentation was inconsistent and testing standards were low. My initiatives:"),
      bullet("Mandated changes to be documented in version control with clear descriptions"),
      bullet("Raised testing standards — mentored the team on pytest for unit testing, including how to mock small DataFrames to test business logic without a live cluster"),
      bullet("Introduced a standardized test case sheet for all developments, committed to Git alongside code"),
      subHeading("2. Mentorship Approach: Architecture Over Syntax"),
      bullet("Code Reviews as Teaching Moments: Instead of just pointing out bugs, use PR reviews to explain WHY a transformation is inefficient. E.g., explain why count() in the middle of a transformation should be avoided."),
      bullet("Design Doc Reviews: Before a junior engineer starts coding a major feature, require a brief design discussion — reviewing idempotency, testing, failure recovery, and cost-efficiency before implementation."),
      bullet("Pair Programming on Incidents: When a production failure occurs, bring a junior engineer onto the call and walk them through the Spark UI and driver logs. This builds confidence in 'debugging under fire' and reduces team dependency on senior engineers for on-call issues."),
      subHeading("3. Documentation & Knowledge Management"),
      para("I noticed a lot of 'tribal knowledge' regarding our legacy Java Play system. To fix this, I led a Runbook Library initiative:"),
      bullet("Documented the lineage of our pipeline — identifying upstream sources and downstream consumers"),
      bullet("Created 'Troubleshooting Guides' for the most common failures"),
      bullet("Result: Significantly reduced onboarding time for new hires and lowered the volume of repeat questions to senior engineers"),
    ]
  },
  {
    num: 27,
    q: "How do you set up monitoring and alerting for critical data pipelines?",
    kw: "Databricks SQL Alerts, Splunk, data quality alerts, SLA monitoring, dashboards",
    content: [
      subHeading("1. Data Quality Alerts (Databricks)"),
      bullet("Set up Databricks SQL Alerts on all Databricks jobs"),
      bullet("Automated email sent to the engineering team immediately on failure or DQ threshold breach"),
      bullet("Monitor record counts, null rates, duplicate rates, and processing times per pipeline stage"),
      subHeading("2. System & Error Logging (Splunk / CloudWatch)"),
      bullet("All PySpark job logs forwarded to Splunk (or CloudWatch in AWS-native setups)"),
      bullet("Set up Splunk Alerts to look for specific keywords like 'Exception' and 'Error'"),
      bullet("Configure severity levels — CRITICAL alerts page on-call engineer; WARNING alerts are batched for morning review"),
      subHeading("3. Visual Health Dashboards"),
      bullet("Built Splunk Dashboards (or Databricks SQL Dashboards) to track status of all pipelines"),
      bullet("Dashboard visualizes Record Counts and Processing Time for each stage (Bronze, Silver, Gold)"),
      bullet("SLA tracking: Visual indicators showing whether each pipeline is on track for its SLA window"),
      subHeading("4. Proactive Monitoring Best Practices"),
      bullet("Data volume anomaly detection: Alert if daily record count drops by more than 10% vs rolling 7-day average"),
      bullet("Freshness checks: Alert if data in Silver/Gold is older than expected"),
      bullet("Cost monitoring: Set up AWS Cost Anomaly Detection and Databricks cost alerts"),
      bullet("Runbooks: Every alert has a linked runbook with troubleshooting steps"),
    ]
  },
  {
    num: 28,
    q: "Walk me through a major production incident you debugged and resolved",
    kw: "OOM, GC overhead, Spark UI, job splitting, modular checkpointing, parallel execution, SLA recovery",
    content: [
      subHeading("Situation"),
      para("A critical Spark job in Databricks processing our daily 5 TB volume began failing its 7:00 AM SLA. The job was crashing frequently with OutOfMemory (OOM) errors and severe Garbage Collection (GC) overhead — executors spent more time cleaning memory than processing data."),
      subHeading("Task: Diagnosing the Bottleneck"),
      para("After analyzing the Spark UI and driver logs, I observed:"),
      bullet("Data Volume Spike: Source data had grown significantly, causing the single massive Spark application to exceed cluster memory limits"),
      bullet("Shuffle Stress: Wide transformations creating massive shuffle partitions that executors couldn't handle, leading to GC thrashing"),
      bullet("Single Point of Failure: One giant 'monolithic' job — any failure at the 90% mark required a full restart, making it impossible to hit the SLA"),
      subHeading("Action: Strategic Decomposition"),
      para("Instead of just increasing cluster size, I re-architected the pipeline into six smaller, independent parts:"),
      bullet("Job Splitting: Broke logic down based on input data splits"),
      bullet("Modular Checkpointing: If Part 4 failed, we only had to re-run Part 4, not the entire pipeline"),
      bullet("Memory Management: With smaller datasets per job, Spark could manage memory more efficiently and avoid GC overload"),
      bullet("Parallel Execution: Scheduled independent parts to run in parallel using a workflow orchestrator, fully utilizing cluster resources without overloading a single Spark driver"),
      subHeading("Result"),
      bullet("OOM and GC failures eliminated — memory pressure distributed across smaller, manageable tasks"),
      bullet("SLA Recovery: Despite overhead of multiple jobs, overall end-to-end time decreased by eliminating retry cycles"),
      bullet("Cost Efficiency: Able to use smaller, more cost-effective worker nodes since we no longer needed massive RAM to hold the entire daily dataset"),
    ]
  },
  {
    num: 29,
    q: "How do you handle data privacy, GDPR/CCPA compliance, and PII in your pipelines?",
    kw: "PII, GDPR, CCPA, right to erasure, Delta DELETE, architectural isolation, anonymization",
    content: [
      subHeading("Architectural Isolation (Upstream Cleaning)"),
      para("I primarily worked on derived data systems where PII was removed or anonymized before reaching analytical layers. By the time data hit PySpark pipelines, it was already cleaned of sensitive user identifiers — this is the most robust approach."),
      subHeading("Handling Right to be Forgotten (GDPR Article 17)"),
      para("Even with cleaned telemetry, we had to comply with GDPR/CCPA requests to remove data associated with specific hardware:"),
      bullet("Managed a specialized pipeline processing 'Deletion Requests' from upstream systems"),
      bullet("Requests targeted specific unique identifiers (like Printer Serial Number)"),
      bullet("Used the DELETE command to remove all records associated with that identifier across Bronze, Silver, and Gold tables"),
      bullet("Maintained an immutable Audit Log table recording: user_id, request_id, requested_at, processed_at, deleted_by"),
      subHeading("Technical Controls"),
      bullet("Column-level masking: Use Unity Catalog's dynamic data masking to hide PII at query time for unauthorized users"),
      bullet("Row-level security: Implement RLS so users only see records they are authorized to view"),
      bullet("Encryption: Encrypt PII columns at rest using AWS KMS or Databricks-managed encryption"),
      bullet("Access controls: Strict IAM policies and Unity Catalog ACLs — only compliance-approved jobs can run deletions"),
      subHeading("After Physical Deletion"),
      bullet("Run VACUUM with a retention period (7–30 days) to physically remove old files from Delta Log"),
      bullet("Use Delta Change Data Feed (CDF) to track all deletions for compliance auditing"),
      bullet("Regularly test the end-to-end workflow with synthetic deletion requests"),
    ]
  },
  {
    num: 30,
    q: "How do you implement data lineage and cataloguing in a large organization?",
    kw: "Unity Catalog, metadata management, column-level lineage, data discovery, data contracts",
    content: [
      subHeading("1. Centralized Metadata Management (Unity Catalog)"),
      bullet("Use Unity Catalog as the primary source of truth in a Databricks environment"),
      bullet("Implement a 'Three-Tier Namespace' (catalog.schema.table) aligned with business units — e.g., finance.reporting.daily_revenue"),
      bullet("Automatic Lineage: Unity Catalog automatically captures column-level and table-level lineage by analyzing Spark execution plans — maps how data flows from S3 landing zone through Bronze, Silver, and Gold layers"),
      subHeading("2. Automated Cataloguing & Discovery"),
      bullet("Business Descriptions: Enforce a process where no table is promoted to the Gold layer unless it contains metadata descriptions for every column"),
      bullet("Data Profiling: Integrate profiling tools to capture data distributions and 'Last Updated' timestamps — helps analysts quickly identify if a dataset is fresh and trustworthy"),
      bullet("Tags & Classifications: Apply consistent tags (team, domain, PII flag, SLA tier) to every table"),
      subHeading("3. Enabling Self-Service"),
      bullet("Expose the catalog through a data discovery UI (Unity Catalog Explorer or DataHub)"),
      bullet("Implement search by business terms, not just technical names"),
      bullet("Create data products with clear SLAs and ownership information"),
      subHeading("4. Data Contracts"),
      bullet("Formalize the interface between data producers and consumers — schema, quality expectations, SLAs"),
      bullet("Version data contracts alongside pipeline code in Git"),
      bullet("Alert downstream consumers when upstream schema changes that violate the contract"),
    ]
  },
  {
    num: 31,
    q: "How are you thinking about integrating LLMs / GenAI into data pipelines?",
    kw: "LLM, GenAI, automated data governance, synthetic test data, vector databases, Unity Catalog",
    content: [
      subHeading("1. Automated Data Governance & Cataloging"),
      para("One of the biggest challenges in a large organization is maintaining the Data Catalog:"),
      bullet("Use LLMs to automatically generate table and column descriptions based on the schema and a sample of the data"),
      bullet("Explore Vector Databases (like Pinecone or Databricks Vector Search) to store table metadata — allows engineers and analysts to ask natural language questions like 'Which table contains printer ink levels for the EMEA region?'"),
      bullet("Auto-classify PII columns based on column names and sample values using a fine-tuned classifier"),
      subHeading("2. Synthetic Data & Testing"),
      bullet("Use LLMs to generate high-quality synthetic test data that mimics edge cases — ensures pytest suites cover scenarios that are hard to generate manually"),
      bullet("Generate realistic but anonymized sample datasets for development and testing environments"),
      subHeading("3. RAG Pipelines for Internal Knowledge"),
      bullet("Ingest documents from SharePoint, Confluence, S3 using document parsers (Unstructured.io or LlamaParse)"),
      bullet("Implement semantic chunking with metadata (document_id, section, page_number, access_level)"),
      bullet("Run embedding jobs on Databricks using Spark for parallel processing at scale"),
      bullet("Use hybrid search (Vector similarity + BM25 keyword search) for robust retrieval"),
      subHeading("4. ML Training Data Pipelines vs Traditional Analytics"),
      bullet("Deduplication at scale: MinHash + LSH for near-duplicate detection at web scale"),
      bullet("Quality filtering: Perplexity filtering, toxicity classifiers, language identification"),
      bullet("PII scrubbing: Microsoft Presidio + custom regex + LLM-based PII detectors"),
      bullet("Tokenization-aware chunking: Must respect sentence/semantic boundaries and context windows"),
      bullet("Data provenance: Detailed tracking for Model Cards and regulatory compliance (EU AI Act)"),
    ]
  },
  {
    num: 32,
    q: "Your Spark job runs fine for 3 weeks, then suddenly OOMs on day 25. What happened?",
    kw: "OOM, data skew, join fan-out, driver vs executor OOM, salting, AQE, Spark UI investigation",
    content: [
      para("When a job that was stable for weeks suddenly starts failing with OOM errors, it usually indicates something in the data or workload has changed — not necessarily the code."),
      subHeading("Most Likely Causes"),
      bullet("Data Skew: A new high-volume customer, device, or key started sending much more data than usual"),
      bullet("Data Volume Growth: Partition sizes grew significantly over time (small files problem getting worse)"),
      bullet("Join Explosion / Fan-out: A join started producing a much larger intermediate result set due to changing cardinality"),
      bullet("Driver OOM vs Executor OOM — Different root causes and different fixes"),
      subHeading("Step 1: Identify the Type of OOM"),
      bullet("Driver OOM: Usually caused by collect() actions, broadcast joins with very large tables, or too much data brought to the driver"),
      bullet("Executor OOM: Almost always related to data skew, large shuffles, or insufficient executor memory"),
      subHeading("Step 2: Analyze Spark UI"),
      bullet("Stages tab: Find the stage where the job failed"),
      bullet("Huge difference between max and median task duration → Data Skew"),
      bullet("Very high shuffle read/write → Large shuffle or join explosion"),
      bullet("High spill to disk → Memory pressure"),
      bullet("Executors tab: Memory usage patterns and failed executors"),
      subHeading("Step 3: Data Profiling"),
      bullet("Run: GROUP BY join_key ORDER BY count DESC — look for sudden spikes"),
      bullet("Compare data volume and distribution with previous successful days"),
      subHeading("Step 4: Fixes"),
      bullet("Data Skew: Use salting technique, repartitionByRange, or increase spark.sql.adaptive.skewJoin.enabled"),
      bullet("Large Broadcast Join: Increase broadcast threshold or switch to Shuffle Hash Join"),
      bullet("Growing Data Volume: Enable Auto Loader file bin-packing, increase maxPartitionBytes, run OPTIMIZE + ZORDER more frequently"),
      bullet("Driver OOM: Avoid bringing large data to driver. Use limit() carefully; monitor broadcast variables"),
      para("Real example: In our telemetry pipeline, a new firmware version from one major customer suddenly started sending 50x more events. Identified quickly via task metrics in Spark UI, applied salting on device_id column, and enabled AQE — job became stable without increasing cluster size."),
    ]
  },
  {
    num: 33,
    q: "A downstream BI dashboard shows numbers that are 10% off from last week. How do you trace the root cause?",
    kw: "data lineage, layer-by-layer validation, Unity Catalog, DQ metrics, reconciliation queries",
    content: [
      para("My approach: systematically walk upstream from the dashboard all the way back to raw ingestion, using data lineage as a guide."),
      subHeading("Step 1: Validate the Dashboard & Business Metric"),
      bullet("Confirm the issue with the stakeholder — understand exactly which metric is off"),
      bullet("Check if it's a real drop or a visualization/dashboard bug (filter change, cache issue, incorrect calculation)"),
      bullet("Reproduce the issue by running the underlying query directly against the Gold table"),
      subHeading("Step 2: Trace Data Lineage"),
      bullet("Dashboard → Gold Table (aggregated business data product)"),
      bullet("Gold Table → Silver Layer (cleaned & enriched data)"),
      bullet("Silver Layer → Bronze Layer (raw ingested data)"),
      bullet("Bronze Layer → Ingestion source (S3, API, Kafka, etc.)"),
      subHeading("Step 3: Layer-by-Layer Validation"),
      bullet("Gold Layer: Compare today's aggregates with last week's using the same logic. Check if business rules (filters, joins, window functions) have changed."),
      bullet("Silver Layer: Validate key DQ metrics — record count, null rates, duplicate rates, and distribution of important columns. Look for sudden spikes."),
      bullet("Bronze Layer: Check raw data volume, file counts, schema changes. Run GROUP BY on ingestion date to see if less data was received."),
      bullet("Ingestion Layer: Verify upstream APIs, S3 event notifications, Auto Loader logs, Kafka lag. Check for failed jobs, rate limiting, or source system outages."),
      subHeading("Step 4: Common Root Causes"),
      bullet("Upstream data drop (source system sending 10% less data)"),
      bullet("Schema change or new partitioning causing records to be dropped"),
      bullet("Transformation logic bug (incorrect join condition or filter)"),
      bullet("Data quality issue (increased duplicates, nulls in key columns)"),
      bullet("Late-arriving data or reprocessing that didn't fully complete"),
      para("Real example: In our telemetry pipeline, daily active device count dropped ~12%. By walking the lineage, we discovered that a new device type was introduced with a different JSON structure, causing the Silver layer parsing logic to drop those records silently. Fixed with improved schema evolution handling and a new DQ rule."),
    ]
  },
  {
    num: 34,
    q: "Your Airflow DAG runs fine locally but fails in prod every Friday night. What's your debugging approach?",
    kw: "environment parity, resource contention, cron edge cases, timezone issues, dependency chain, catchup",
    content: [
      italic("Classic 'works on my machine' problem with a time-specific failure pattern — usually points to environment differences, resource contention, or scheduling edge cases."),
      subHeading("Step 1: Immediate Failure Analysis"),
      bullet("Check Airflow UI logs and task logs for the exact failing task and error message"),
      bullet("Look at the stack trace and timing — does it fail at the same task every Friday?"),
      bullet("Check Airflow's catchup settings and whether backfills are interfering"),
      subHeading("Step 2: Environment Parity Check"),
      bullet("Compare local vs prod environment: Python package versions, Airflow version and provider versions"),
      bullet("Configuration differences: Connections, Variables, Environment Variables"),
      bullet("Resource limits: CPU, Memory, Executor type (Celery vs KubernetesExecutor)"),
      bullet("Validate that the prod Docker image or environment is identical to what was tested locally"),
      subHeading("Step 3: Resource Contention & Friday Night Specifics"),
      bullet("Resource contention: Production clusters under heavier load on Friday nights due to weekend batch jobs or maintenance windows"),
      bullet("Check cluster metrics: CPU, Memory, Disk I/O, and YARN/Spark queue usage during failure time"),
      bullet("Executor scaling limits: Is the worker pool getting exhausted?"),
      subHeading("Step 4: Timing & Dependency Chain Issues"),
      bullet("Cron/Schedule edge cases: Friday night might involve month-end, quarter-end logic, or timezone/DST issues (UTC vs local time)"),
      bullet("Check task dependencies: Is an upstream DAG or external sensor failing only on Fridays?"),
      bullet("Data volume spikes: Does Friday have significantly higher data volume (e.g., weekly batch from source systems)?"),
      subHeading("Step 5: Prevention Measures"),
      bullet("Make DAGs idempotent and resilient to retries"),
      bullet("Add resource requests/limits in KubernetesExecutor"),
      bullet("Implement data volume-based alerts and circuit breakers"),
      bullet("Run chaos testing or schedule tests on production-like environments on Fridays"),
    ]
  },
  {
    num: 35,
    q: "A vendor changes their API response schema without notice. How does your pipeline detect and survive this?",
    kw: "schema-on-read, dead letter queue, schema registry, Auto Loader rescue data, alerting, quarantine",
    content: [
      para("I design pipelines to be resilient by default to upstream schema changes."),
      subHeading("1. Schema-on-Read Approach (Preferred for Vendor APIs)"),
      para("Avoid strict schema enforcement at ingestion time. Instead, use schema-on-read:"),
      bullet("Ingest raw data as-is (usually as JSON string or binary) into the Bronze layer"),
      bullet("This ensures no data is lost even if the schema changes completely"),
      subHeading("2. Detection Mechanisms"),
      bullet("Schema Drift Detection: After ingestion, run automated validation job comparing incoming schema with expected schema using PyDeequ or Great Expectations"),
      bullet("Anomaly Detection: Monitor for new columns appearing, existing columns disappearing or changing type, sudden increase in null rates or parsing errors"),
      bullet("Alerting: If drift detected, trigger immediate alerts (Slack/Email/PagerDuty) to team and vendor"),
      subHeading("3. Survival & Resilience Patterns"),
      bullet("Dead Letter Queue (DLQ) / Quarantine Table: Records that fail to parse or violate critical rules are automatically routed to a quarantine Delta table with metadata (error reason, raw payload, ingestion timestamp). Good records continue flowing."),
      bullet("Schema Evolution Handling: In Silver layer, use Delta Lake's mergeSchema or rescue columns to safely capture unexpected fields without breaking the job."),
      bullet("Schema Registry: For critical vendors, integrate with Confluent Schema Registry or AWS Glue Schema Registry to enforce compatibility rules and detect breaking changes early."),
      subHeading("4. Recovery Process"),
      bullet("Once alerted, analyze the quarantined data"),
      bullet("Update the Silver/Gold transformation logic to handle the new schema"),
      bullet("Reprocess quarantined records using the updated code (thanks to idempotency)"),
      para("Real example: At HP, a vendor added new nested fields and changed a data type without notice. Because we had schema-on-read + quarantine logic, the pipeline did not fail. Only ~3% of records went to quarantine. We were alerted immediately, fixed the transformation within hours, and successfully reprocessed quarantined data with zero downstream impact."),
    ]
  },
  {
    num: 36,
    q: "You need to backfill 2 years of historical data without impacting the production pipeline. How?",
    kw: "separate cluster, idempotent writes, partition-level overwrite, Airflow concurrency limits, rollback",
    content: [
      para("My main goal is to isolate the backfill completely from the production pipeline to avoid performance degradation, increased costs, or data quality issues."),
      subHeading("Step-by-Step Approach"),
      boldPara("1. Isolation from Production: ", "Run the backfill on a separate compute cluster (in Databricks) or a dedicated Airflow worker queue, so it doesn't compete with production jobs for resources. Use separate job configurations with lower priority and controlled concurrency."),
      boldPara("2. Idempotent Design: ", "Ensure the entire pipeline is fully idempotent — can safely re-run multiple times without creating duplicates. Rely on Delta Lake's MERGE capability or insert overwrite at the partition level."),
      boldPara("3. Partition-Level Backfill Strategy: ", "Break the 2-year backfill into smaller chunks — typically by date partitions (one month or one quarter at a time). For each partition, use partition-level overwrite in Delta Lake with replaceWhere option."),
      boldPara("4. Orchestration & Controlled Execution: ", "Use Airflow to orchestrate with limited concurrency (max 2–4 parallel tasks) to control load on the warehouse and downstream systems. Include automatic retries with exponential backoff and dry-run mode."),
      boldPara("5. Validation & Cutover: ", "After each batch (or at the end), run automated reconciliation jobs comparing record counts, sums, and key metrics between old and new data. Once complete and validated, switch downstream consumers using views or table renaming."),
      subHeading("Additional Safeguards"),
      bullet("Monitor cluster utilization, job duration, and cost in real-time"),
      bullet("Have a rollback plan — Delta Lake Time Travel makes this easy"),
      bullet("Run backfill during off-peak hours when possible"),
      para("Real example: In our telemetry platform, I successfully backfilled 18+ months (~1.2 PB) of data using this pattern. The production pipeline continued running with zero impact, and we completed the backfill in 9 days with full validation."),
    ]
  },
  {
    num: 37,
    q: "When would you use Redshift over Databricks, and vice versa?",
    kw: "SQL workloads, Spark engineering, cost model, latency, lakehouse, decision framework",
    content: [
      makeTable(
        ["Factor", "Prefer Redshift", "Prefer Databricks"],
        [
          ["Team Skillset", "Strong SQL / Analysts", "Strong Python/Spark Engineers"],
          ["Workload", "BI, Reporting, Simple Aggregations", "Complex ETL, Streaming, ML"],
          ["Cost Model", "Better for steady, smaller queries", "Better for large, spiky, or long jobs"],
          ["Latency", "Excellent for sub-second queries", "Good for batch & near-real-time"],
          ["Data Volume", "Up to few PB", "Multi-PB + very high velocity"],
          ["Flexibility", "More rigid (warehouse)", "High (Lakehouse)"],
        ],
        [2400, 3480, 3480]
      ),
      subHeading("When I Choose Redshift"),
      bullet("Primarily SQL-based analytics & BI workloads — analysts writing SQL, building dashboards (Tableau, Power BI, QuickSight)"),
      bullet("High concurrency needs — dozens or hundreds of concurrent users querying the same data"),
      bullet("Predictable, steady workloads with consistent daily/weekly reporting"),
      bullet("Simpler operational model for teams that don't want to manage Spark code"),
      subHeading("When I Choose Databricks"),
      bullet("Complex transformations & heavy ETL — PySpark, Scala, advanced data processing, semi-structured/unstructured data"),
      bullet("Lakehouse architecture — combine data lake flexibility with warehouse reliability (Delta Lake / Unity Catalog)"),
      bullet("Streaming + Batch — unified batch and real-time processing (Spark Structured Streaming)"),
      bullet("Data Science & ML workloads — much better support for MLflow, feature stores, model serving"),
      subHeading("My Decision Framework"),
      bullet("Primary consumers are analysts + SQL workload → Redshift"),
      bullet("Team writes Spark code, needs streaming, or wants full lakehouse → Databricks"),
      bullet("In many modern setups: Databricks for ETL/ELT and heavy transformation + Redshift as high-performance SQL warehouse for final consumption"),
    ]
  },
  {
    num: 38,
    q: "How do you decide partition strategy for a Delta table receiving 50 GB/day?",
    kw: "date partitioning, Z-ORDER, Liquid Clustering, file size targets, query predicate alignment",
    content: [
      subHeading("1. Start with Query Patterns (Most Important)"),
      bullet("Analyze the most frequent WHERE clauses used by downstream consumers (dashboards, reports, ML models)"),
      bullet("Date / Timestamp is almost always a strong candidate because time-based queries are very common (e.g., 'last 7 days', 'this month')"),
      subHeading("2. Recommended Partitioning Strategy"),
      bullet("Primary Partitioning: Date partitioning (by year, month, or date) — 50 GB/day means ~50–150 GB per partition, manageable and well-suited for time-range queries"),
      bullet("Z-ORDERing for high-cardinality columns: Apply ZORDER BY (device_id, customer_id, region) on columns frequently filtered but not suitable for partitioning"),
      bullet("Liquid Clustering (Databricks Runtime 13.3+): Preferred over traditional partitioning + Z-order. Automatically maintains good clustering on multiple columns; handles evolving query patterns better."),
      subHeading("3. File Size Targets"),
      bullet("Ideal file size per partition: 128 MB – 1 GB (sweet spot is 256–512 MB)"),
      bullet("With 50 GB/day, aim for 100–400 files written per day"),
      bullet("Use spark.sql.files.maxPartitionBytes = 256MB during writes"),
      bullet("Regular OPTIMIZE + ZORDER / Liquid Clustering jobs"),
      subHeading("4. Trade-offs"),
      makeTable(
        ["Strategy", "When to Use", "Pros", "Cons"],
        [
          ["Date Partitioning", "Time-series heavy queries", "Pruning, easy archiving", "Many small partitions if overdone"],
          ["Z-Ordering", "High-cardinality filter columns", "Good for point lookups", "Higher write overhead"],
          ["Liquid Clustering", "Modern tables with evolving queries", "Flexible, low maintenance", "Databricks only"],
          ["No Partitioning", "Very even access patterns", "Simpler", "Poor pruning on large tables"],
        ],
        [2400, 2700, 2300, 1960]
      ),
      para("Real example: In our telemetry platform (processing ~500 GB–2 TB/day), we used date partitioning + Liquid Clustering on device_type and region. This reduced query times by 60–70% while keeping OPTIMIZE jobs reasonable."),
    ]
  },
  {
    num: 39,
    q: "Your team is debating Airflow vs Databricks Workflows vs AWS Step Functions. Walk us through your evaluation.",
    kw: "orchestration, dependency management, cost, observability, portability, Step Functions",
    content: [
      makeTable(
        ["Factor", "Apache Airflow", "Databricks Workflows", "AWS Step Functions"],
        [
          ["Dependencies", "Best-in-class — complex branching, sensors, dynamic DAGs", "Very good — linear, fan-out, multi-task", "Good for state machines, messy for complex data pipelines"],
          ["Cost", "Higher if self-managed; cheaper on MWAA", "Most cost-effective for Spark-heavy workloads", "Very cheap for simple; adds up at high frequency"],
          ["Observability", "Excellent UI, rich logs, plugins", "Strong — tight Spark UI + Unity Catalog integration", "Good visual tracking, less insightful for Spark"],
          ["Team Skills", "Great if strong in Python/open-source", "Highest productivity if team is in Databricks", "Best if team is deep into AWS services"],
          ["Portability", "Winner — runs anywhere", "Tied to Databricks (multi-cloud, vendor-locked)", "Locked into AWS"],
        ],
        [2200, 2387, 2387, 2386]
      ),
      subHeading("My Recommendation / Decision Criteria"),
      boldPara("Choose Databricks Workflows if: ", "Most pipelines are built in Databricks (Spark, Delta Lake). You want simplicity, great Spark integration, and lower cost."),
      boldPara("Choose Airflow if: ", "You have complex dependencies, many heterogeneous systems, or need high customization. You want open-source flexibility and portability."),
      boldPara("Choose AWS Step Functions if: ", "Architecture is heavily AWS-native (Glue, Lambda, EMR, S3 events). You need serverless orchestration with minimal operational overhead."),
      subHeading("Real-World Example"),
      para("In my previous role, we started with Airflow but migrated most Spark pipelines to Databricks Workflows — reducing operational overhead and cutting orchestration-related costs by no longer needing a dedicated Airflow cluster. We kept Airflow for non-Spark tasks (API calls, notifications, cross-system workflows)."),
      para("Bottom line: I recommend a hybrid approach — Databricks Workflows for data-heavy pipelines and Airflow/Step Functions for broader enterprise orchestration."),
    ]
  },
  {
    num: 40,
    q: "How do you design an idempotent pipeline — one that can be safely re-run without double-counting?",
    kw: "deterministic keys, MERGE, Write-Audit-Publish, Delta ACID, replaceWhere, natural keys",
    content: [
      para("An idempotent pipeline can be safely re-run multiple times (due to failures, retries, or backfills) without causing duplicate records or incorrect results. This is one of the most important properties in data engineering."),
      subHeading("Core Principles"),
      boldPara("1. Use Deterministic Keys: ", "Every record must have a clear, unique business key (or composite key) — e.g., event_id, device_id + event_timestamp, order_id + ingestion_date. Avoid relying on surrogate keys or auto-increment IDs for deduplication."),
      boldPara("2. Prefer Upsert (MERGE) over Append: ", "Instead of blindly appending data, use Delta Lake's MERGE statement to upsert records based on natural/business key. This ensures that if the same record arrives again, it updates the existing one instead of creating duplicates."),
      subHeading("3. Write-Audit-Publish (WAP) Pattern"),
      bullet("Write: Write new data into a staging / temporary table or hidden partition"),
      bullet("Audit: Run comprehensive DQ checks, row counts, and business validations"),
      bullet("Publish: Only after validation passes, atomically publish the data using MERGE or REPLACE WHERE (partition overwrite)"),
      para("This prevents bad data from ever reaching final Gold tables."),
      subHeading("4. Transactional Guarantees with Delta Lake"),
      bullet("Leverage Delta Lake's ACID transactions so that each job is atomic"),
      bullet("Use option('replaceWhere', 'date = today') for partition-level overwrites during backfills or retries"),
      bullet("Enable delta.enableChangeDataFeed when downstream systems need to consume only changed data"),
      subHeading("Additional Best Practices"),
      bullet("Make the entire pipeline re-runnable by using ingestion date or watermark columns"),
      bullet("Store raw data in Bronze layer forever (immutable) so you can always reprocess"),
      bullet("Add job metadata (ingestion_run_id, processed_at) for traceability"),
      bullet("Use orchestration tools (Airflow/Databricks Workflows) with proper retry policies and idempotency keys"),
    ]
  },
  {
    num: 41,
    q: "How do you handle a many-to-many relationship efficiently in a data warehouse?",
    kw: "bridge tables, array columns, denormalization, Kimball, Liquid Clustering, surrogate keys",
    content: [
      subHeading("1. Bridge Table (Classic Kimball Approach) — Most Common"),
      para("Create an intermediate bridge/associative table that contains the keys from both dimensions along with any relationship attributes (e.g., effective_date, role, quantity). Example:"),
      bullet("fact_order + dim_product + bridge_order_product (with order_id, product_id, quantity, price_at_sale)"),
      bullet("Advantages: Clean, flexible, supports accurate weighting for metrics"),
      bullet("When to use: Precise analytics and the relationship has additional attributes"),
      subHeading("2. Array / Struct Columns in Delta Lake (Modern Lakehouse Approach)"),
      para("Store the many side as an array column in the main table:"),
      bullet("Example: In dim_user, have a column devices as array<struct<device_id: string, assigned_date: timestamp>>"),
      bullet("Advantages: Excellent query performance using array_contains() or explode(); simpler query writing; efficient Delta Lake compression"),
      bullet("When to use: Relationship is relatively stable and queries mostly go from the 'one' side to the 'many' side"),
      subHeading("3. Full Denormalization (Flattened Table)"),
      bullet("Flatten the relationship by duplicating rows (wide fact table)"),
      bullet("Pros: Extremely fast queries, no joins needed"),
      bullet("Cons: Higher storage cost, update anomalies, risk of incorrect aggregations (must use COUNT(DISTINCT) carefully)"),
      bullet("Use only when query performance is extremely critical and data volume is manageable"),
      makeTable(
        ["Scenario", "Recommended Approach", "Reason"],
        [
          ["Complex relationship attributes", "Bridge Table", "Flexibility & accuracy"],
          ["High query performance needed", "Array Columns + Delta", "Best read performance"],
          ["Simple M:M + BI users", "Bridge Table", "Easy for SQL analysts"],
          ["Very high cardinality + frequent use", "Denormalized / Exploded table", "Speed"],
        ],
        [3000, 3380, 2980]
      ),
    ]
  },
  {
    num: 42,
    q: "Your S3 costs doubled in a month. How do you diagnose and reduce them?",
    kw: "S3 Storage Lens, Intelligent-Tiering, lifecycle policies, small file proliferation, cross-region replication",
    content: [
      subHeading("Step 1: Diagnose the Root Cause (First 24–48 hours)"),
      boldPara("S3 Storage Lens: ", "Enable at the organization level. Gives the best dashboard for cost breakdown by bucket/prefix/storage class, object count trends, average object size, and percentage of data in different storage tiers."),
      boldPara("AWS Cost Explorer + Billing Reports: ", "Filter by Service = S3 and break down by Usage Type (Storage, Requests, Data Transfer, etc.)."),
      subHeading("Key Things to Look For"),
      bullet("Small File Proliferation: Lots of tiny files (< 1MB) dramatically increases LIST, GET, and PUT request costs"),
      bullet("Unexpected Storage Class Usage: Too much data still sitting in Standard storage"),
      bullet("Cross-Region Replication (CRR): Accidentally replicating large volumes to another region"),
      bullet("Data Growth: Sudden spike in new data volume or duplicate copies"),
      bullet("Request Costs: High number of GET/LIST operations from inefficient Spark jobs or downstream tools"),
      subHeading("Step 2: Immediate Cost Reduction Actions"),
      bullet("Implement/Optimize S3 Intelligent-Tiering: Apply to all non-hot buckets — automatically moves data between Frequent Access, Infrequent Access, and Archive tiers"),
      bullet("S3 Lifecycle Policies: Move data older than 30 days to Infrequent Access; data older than 90–180 days to Glacier Instant Retrieval or Deep Archive; delete temporary files (Spark _temporary folders) after X days"),
      bullet("Fix Small File Problem: Run compaction jobs (OPTIMIZE in Delta Lake) to merge small files into 128–512 MB files; adjust upstream writers"),
      bullet("Audit & Stop Waste: Disable unnecessary CRR; delete unused buckets and old versions; review IAM policies to prevent accidental data copying"),
      subHeading("Step 3: Long-term Prevention"),
      bullet("Set up budgets + anomaly detection alerts in AWS Cost Explorer"),
      bullet("Enforce storage tagging (team, project, lifecycle) and governance"),
      bullet("Implement Data Lifecycle Management as part of the architecture review process"),
      bullet("Monitor Storage Lens weekly and set custom dashboards"),
      para("Real example: In our telemetry platform, S3 costs increased sharply due to massive small-file generation from Spark jobs. Using Storage Lens, we identified the offending buckets, ran compaction jobs, applied Intelligent-Tiering + aggressive lifecycle policies, and reduced S3 storage costs by ~45% within three weeks."),
    ]
  },
  {
    num: 43,
    q: "How do you right-size a Databricks cluster for a mixed workload of ETL and ad-hoc queries?",
    kw: "autoscaling, spot vs on-demand, Serverless SQL, Photon, ETL vs ad-hoc, cluster policies",
    content: [
      subHeading("1. Understand Workload Patterns"),
      bullet("ETL Jobs: High CPU/memory usage, long-running, shuffle-heavy, can tolerate some delay"),
      bullet("Ad-hoc Queries: Short, bursty, low tolerance for latency, mostly SQL from analysts/BI tools"),
      subHeading("2. Cluster Configuration Strategy"),
      boldPara("For ETL Workloads: ", "Use Classic Compute or Jobs Compute with Photon acceleration enabled. Photon can give 2–3x faster performance on Spark SQL and Delta operations."),
      boldPara("For Ad-hoc Queries: ", "Prefer Serverless SQL Warehouses (if on Databricks SQL) or a dedicated SQL Warehouse with auto-stop. Much more cost-effective and responsive for BI users."),
      boldPara("Hybrid Approach (Recommended): ", "Separate clusters — one optimized for ETL (Jobs cluster) and one for interactive/ad-hoc (SQL Warehouse)."),
      subHeading("3. Autoscaling Policies"),
      bullet("Min Workers: Set based on average baseline load (e.g., 4–6 workers)"),
      bullet("Max Workers: Set 2.5x–3x the min to handle spikes (e.g., min 6 → max 18)"),
      bullet("Enable Enhanced Autoscaling (Databricks feature) which scales more aggressively"),
      bullet("For ETL jobs: Use cluster policies with auto-termination (10–20 minutes)"),
      subHeading("4. Spot vs On-Demand Mix"),
      bullet("80% Spot + 20% On-Demand for ETL clusters → Significant cost savings with minimal risk"),
      bullet("100% On-Demand for production-critical ad-hoc SQL Warehouses to avoid interruptions"),
      subHeading("5. Key Spark Configurations"),
      bullet("Enable Photon Acceleration (especially for ETL)"),
      bullet("Set appropriate spark.sql.shuffle.partitions and spark.sql.adaptive.enabled = true"),
      bullet("Use memory-optimized instances (r6i or r7i series) for shuffle-heavy ETL"),
      subHeading("6. Monitoring & Continuous Right-Sizing"),
      bullet("Monitor Cluster Utilization (CPU, Memory, Disk) and Spark UI metrics regularly"),
      bullet("Set up alerts if cluster utilization stays below 40% for long periods"),
      bullet("Review and adjust cluster sizes every 2–4 weeks based on actual usage"),
      para("Real example: We split from one large all-purpose cluster into a Jobs Cluster (70% Spot + Photon) for ETL and a Serverless SQL Warehouse for analyst queries — reducing monthly Databricks cost by ~38% while improving ad-hoc query performance."),
    ]
  },
  {
    num: 44,
    q: "How would you reduce Redshift query costs for a table scanned 10,000 times a day?",
    kw: "DISTKEY, SORTKEY, zone maps, result caching, materialized views, AQUA, compression",
    content: [
      para("If a table is being scanned 10,000 times a day, the biggest cost driver is data scanning — the number of bytes read per query. My goal: dramatically reduce the amount of data Redshift scans per query."),
      subHeading("1. Optimize Table Design (Most Impactful)"),
      boldPara("Distribution Key (DISTKEY): ", "Choose a column frequently used in JOIN conditions with high cardinality and even distribution. Goal: Co-locate joined data on the same node to minimize data movement. Example: DISTKEY(customer_id) if often joined on customer_id."),
      boldPara("Sort Key (SORTKEY): ", "Set a compound sort key on columns most commonly used in WHERE clauses and range filters. This enables zone maps so Redshift can skip large portions of data blocks. Example: SORTKEY(event_date, customer_id)."),
      boldPara("Compression: ", "Ensure all columns are properly compressed — verify with ANALYZE COMPRESSION."),
      subHeading("2. Materialized Views"),
      bullet("Create Materialized Views for the most common query patterns (especially aggregations and frequent joins)"),
      bullet("Refresh on a schedule (incremental refresh if possible)"),
      bullet("This can reduce query cost from scanning the base table to scanning a much smaller pre-aggregated result"),
      subHeading("3. Result Caching"),
      bullet("Enable Result Caching at the cluster level"),
      bullet("Redshift automatically caches query results for identical queries — since many of the 10,000 scans are likely repetitive dashboard queries, this can serve results directly from cache with near-zero cost after the first execution"),
      subHeading("4. AQUA (Advanced Query Accelerator)"),
      bullet("Enable AQUA on the Redshift cluster (available on RA3 node types)"),
      bullet("AQUA offloads scans, filters, and aggregations to FPGA-accelerated hardware — can improve performance by 2–10x and reduce compute cost for scan-heavy queries"),
      subHeading("5. Additional Optimizations"),
      bullet("Query Rewriting: Work with BI teams to push filters earlier and avoid SELECT *"),
      bullet("Concurrency Scaling: Enable to automatically add capacity during spikes"),
      bullet("Regular Maintenance: Run VACUUM, ANALYZE, and ANALYZE COMPRESSION on a schedule"),
      para("Expected impact: Implementing DISTKEY + SORTKEY + Materialized Views + Result Caching can often reduce scanned bytes by 70–90%. In a previous project, daily Redshift costs for a heavily queried fact table dropped by over 65%."),
    ]
  },
  {
    num: 45,
    q: "A data scientist keeps bypassing the pipeline and querying prod directly. How do you handle it?",
    kw: "collaboration, governance, sandbox environment, analytics views, self-serve data products, data contracts",
    content: [
      para("This is a very common situation in fast-moving organizations. My approach is not to just block them, but to understand the root cause and solve the underlying problem while protecting the production environment."),
      subHeading("1. Start with Curiosity, Not Confrontation"),
      para("Reach out privately (quick call or Slack): 'I noticed you're querying the production tables directly. Can you help me understand what you're trying to achieve? There might be a better or faster way I can support you.'"),
      subHeading("2. Understand the Root Cause"),
      bullet("Are the Gold tables missing data they need?"),
      bullet("Is the pipeline latency too high?"),
      bullet("Are they doing exploratory analysis and need more flexibility?"),
      bullet("Do they lack visibility into the available data products?"),
      subHeading("3. Provide Better Alternatives"),
      bullet("Create a dedicated analytics schema or view layer on top of the Gold tables optimized for their use case"),
      bullet("Build materialized views or summary tables for their frequent queries"),
      bullet("Give them access to a Databricks SQL Warehouse or Redshift query editor with proper read-only permissions"),
      bullet("Set up self-serve data products using dbt + Unity Catalog so they can discover and query governed data easily"),
      bullet("If they need raw access for exploration: create a sandbox environment with recent production data (refreshed daily) instead of letting them hit prod"),
      subHeading("4. Enforce Governance Without Breaking Collaboration"),
      bullet("Clearly explain the risks of querying prod directly (performance impact, security, broken SLAs, data quality issues)"),
      bullet("Update IAM / Unity Catalog policies to restrict direct access to production tables — but always provide approved alternatives first"),
      subHeading("5. Long-term Prevention"),
      bullet("Improve data documentation and discovery (Unity Catalog + data lineage)"),
      bullet("Implement data contracts between teams"),
      bullet("Set up self-service analytics layers so data scientists can be more independent without compromising production"),
      para("Key Takeaway: I treat bypassing as a symptom, not the problem. My goal is to make going through the proper pipeline the easiest and fastest path for them."),
    ]
  },
  {
    num: 46,
    q: "Tell me about a time you had to say no to a business stakeholder's data request",
    kw: "real-time dashboard, cost analysis, near-real-time alternative, stakeholder management, ROI",
    content: [
      subHeading("Situation"),
      para("A Director of Operations wanted us to build a real-time dashboard showing live ink usage and predictive failure metrics for all printers globally, updated every 5 seconds. This would have required changing our main telemetry pipeline from hourly micro-batches to true low-latency streaming, plus heavy aggregations on our largest fact table (processing 2+ TB/day)."),
      subHeading("Task"),
      para("I had to evaluate the request against our platform constraints and long-term goals."),
      subHeading("Action"),
      bullet("Scheduled a meeting to understand the business problem deeply: 'What decision will this dashboard help you make that you can't make today with hourly data?'"),
      bullet("Did a quick impact analysis — estimated this would increase Databricks cost by ~$180k–$250k per year and risk destabilizing the existing SLA for other critical teams"),
      bullet("Proposed alternatives: near-real-time dashboard refreshed every 15 minutes (covering 90% of their use case), a separate predictive analytics dataset in Gold layer refreshed hourly, and an option for a lightweight real-time stream for top 5% of high-value printers only"),
      bullet("Presented trade-offs clearly with data — cost, timeline, risk to other teams, and ROI"),
      subHeading("Result"),
      bullet("Stakeholder appreciated the transparency and data-backed reasoning — agreed to the 15-minute refresh solution initially"),
      bullet("Delivered in 3 weeks instead of 4 months"),
      bullet("Six months later, they thanked us — the near-real-time version was sufficient, and we avoided unnecessary technical debt and cost"),
      para("Key Takeaway: Saying 'No' is rarely the right first response. Saying 'Not this way, but here's a better/cheaper/faster alternative that still solves your problem' builds much stronger trust with the business."),
    ]
  },
  {
    num: 47,
    q: "How do you balance technical debt reduction against feature delivery in a data platform?",
    kw: "70/20/5 capacity model, tech debt backlog, business impact quantification, ROI, prioritization",
    content: [
      para("I treat technical debt as debt with interest — the longer you ignore it, the more expensive it becomes."),
      subHeading("1. Make Technical Debt Visible & Quantifiable"),
      para("I don't treat tech debt as abstract. I quantify it in business terms:"),
      bullet("'This brittle pipeline costs us 12 hours of engineering time per month in maintenance and incidents.'"),
      bullet("'High coupling in the ingestion layer increases risk of a 4-hour outage during peak business hours, potentially costing $X in lost decisions.'"),
      bullet("'Our small-file problem adds ~$8,000/month in unnecessary Databricks compute costs.'"),
      bullet("Maintain a Tech Debt Backlog with estimated effort (story points) and business impact (cost/risk)."),
      subHeading("2. Use a Capacity Allocation Model"),
      bullet("70–75% → New feature delivery & business value work"),
      bullet("20–25% → Technical debt reduction, refactoring, automation, and platform improvement"),
      bullet("5% → Innovation / R&D"),
      para("The 20% capacity for tech debt is non-negotiable. I treat it like applied at the team level."),
      subHeading("3. Prioritization Framework"),
      makeTable(
        ["Impact / Effort", "Action"],
        [
          ["High Impact + Low Effort", "Fix immediately (quick wins)"],
          ["High Impact + High Effort", "Schedule in next quarter planning"],
          ["Low Impact (any effort)", "Accept the debt or defer"],
        ],
        [3200, 6160]
      ),
      subHeading("4. Communication & Transparency"),
      para("Present tech debt reduction in business language during planning sessions. Instead of 'We need to refactor the Silver layer,' say: 'This refactoring will reduce new feature delivery time by 40% and cut monthly compute costs by $12k.'"),
      para("Real example: At HP, we allocated 20% of team capacity for one quarter to address tech debt around small files and schema drift. We reduced average job runtime by 45%, cut monthly Databricks costs by ~$28k, and improved new feature velocity. Business stakeholders fully supported it once they saw the quantified ROI."),
    ]
  },
  {
    num: 48,
    q: "A junior engineer on your team keeps pushing unvalidated code to prod. How do you address it?",
    kw: "CI/CD, PR reviews, branch protection, staging environment, coaching, process first",
    content: [
      para("I treat this as a process and coaching opportunity rather than just an individual performance issue. My goal is to fix the root cause while helping the engineer grow."),
      subHeading("1. Immediate Action — Stop the Bleeding"),
      para("Speak with the engineer privately in a non-blaming way: 'I noticed a few recent deployments went straight to production without going through our usual validation steps. Can we walk through what happened?'"),
      subHeading("2. Focus on Process First"),
      bullet("Enforce mandatory PR reviews with at least one senior engineer approval"),
      bullet("Improve CI/CD pipeline to block deployments if tests are failing or code coverage is below threshold"),
      bullet("Ensure there's a proper staging / pre-prod environment where all changes must be tested first"),
      bullet("Add branch protection rules in GitHub/GitLab so direct pushes to main/prod branches are technically blocked"),
      bullet("Introduce deployment checklists or change approval process for production"),
      subHeading("3. Coach the Individual"),
      bullet("Pair program with them on the next few changes — show the importance of testing and validation"),
      bullet("Explain the business impact: 'A small mistake in prod can affect executive dashboards or ML models and erode trust from our stakeholders.'"),
      bullet("Set clear expectations: 'Every change, no matter how small, must go through PR + CI + staging validation.'"),
      bullet("Give them more structured tasks initially and gradually increase ownership as confidence builds"),
      subHeading("4. Long-term Prevention"),
      bullet("Implement automated quality gates (unit tests, PyDeequ data quality checks, schema validation)"),
      bullet("Run regular code review sessions and knowledge-sharing to raise the overall team standard"),
      bullet("Track deployment success rate as a team metric, not an individual one"),
      para("My Philosophy: Blaming the person rarely fixes the problem. Most frequent bypasses indicate weak guardrails. I focus on making the right way also the easiest way to work."),
    ]
  },
  {
    num: 49,
    q: "How would you implement a right-to-erasure (GDPR Article 17) workflow in a Delta Lake?",
    kw: "Delta DELETE, VACUUM, REWRITE, soft delete, audit trail, CDF, physical deletion, compliance",
    content: [
      subHeading("1. Core Strategy: Soft Delete + Physical Deletion"),
      boldPara("Step A — Logical Deletion (Immediate Response): ", "Add columns is_deleted (BOOLEAN) and erasure_requested_at (TIMESTAMP) to the table. On receiving a deletion request, perform a fast MERGE or UPDATE to mark the record(s) as deleted. This allows responding to the user within hours/days (as required by GDPR)."),
      boldPara("Step B — Physical Deletion (Scheduled): ", "Run a periodic GDPR deletion job (nightly or weekly) that physically removes the data using DELETE WHERE is_deleted = true AND erasure_requested_at < current_timestamp() - INTERVAL 30 DAYS."),
      subHeading("2. Handling Large Tables Efficiently"),
      bullet("Use REWRITE with filter (Databricks) or DELETE with partition pruning for specific partitions"),
      bullet("After deletion, run VACUUM with a retention period (7–30 days) to physically remove old files"),
      subHeading("3. Masking vs Physical Delete"),
      makeTable(
        ["Approach", "Use Case", "Pros", "Cons"],
        [
          ["Physical Delete", "Strict compliance, sensitive data", "True erasure, lower storage cost", "Expensive on large tables"],
          ["Query-time Masking", "Less sensitive data, performance", "Very fast, easy to implement", "Data still physically exists"],
          ["Hybrid (Recommended)", "Most production systems", "Balance of speed + compliance", "Slightly more complex"],
        ],
        [2300, 2700, 2680, 1680]
      ),
      subHeading("4. Audit Trail & Compliance"),
      bullet("Maintain a separate immutable Audit Log table recording: user_id, request_id, requested_at, processed_at, deleted_by"),
      bullet("Use Delta Change Data Feed (CDF) to track deletions"),
      bullet("Store erasure requests in a governed gdpr_requests table for regulatory audits"),
      subHeading("5. Best Practices"),
      bullet("Make the process fully automated via Databricks Workflows or Airflow"),
      bullet("Implement data retention policies per domain (e.g., 30 days for erasure requests)"),
      bullet("Add strong access controls (Unity Catalog) so only compliance-approved jobs can run deletions"),
      bullet("Regularly test the end-to-end workflow with synthetic requests"),
    ]
  },
  {
    num: 50,
    q: "How do you manage secrets and credentials in a Databricks/Airflow environment?",
    kw: "Databricks Secrets, AWS Secrets Manager, IAM roles, instance profiles, secret rotation, least privilege",
    content: [
      para("I treat secret management as a critical security and operational practice. Hardcoding credentials or using plaintext is never acceptable in production."),
      subHeading("1. Databricks Environment"),
      boldPara("Databricks Secrets (Primary choice): ", "Store all sensitive values (API keys, database passwords, tokens) using Databricks Secrets. Organize secrets into scopes (e.g., prod, vendor_apis, alerting). Access controlled via ACLs — only specific service principals and users can read them."),
      bullet("Usage: dbutils.secrets.get(scope='prod', key='snowflake-password')"),
      boldPara("Service Principals + IAM Roles: ", "For AWS resources (S3, Redshift, etc.), never use access keys. Attach IAM Roles to Databricks clusters using instance profiles — allows secure, temporary credential assumption without storing any keys."),
      subHeading("2. Airflow Environment"),
      boldPara("AWS Secrets Manager (Preferred): ", "Store secrets centrally in AWS Secrets Manager. Use the official AWS Secrets Manager Airflow Provider to fetch secrets at runtime."),
      boldPara("Airflow Connections & Variables: ", "Store connection strings in Airflow Connections with extra fields pointing to Secrets Manager. Never store actual secrets in Airflow Variables."),
      subHeading("3. Secret Rotation & Best Practices"),
      bullet("Implement automatic rotation policies (especially for database credentials and API keys)"),
      bullet("Use short-lived credentials wherever possible"),
      bullet("Regular secret rotation — every 90 days for API keys, every 30–60 days for DB credentials"),
      bullet("Audit access logs in Databricks and AWS CloudTrail"),
      bullet("Apply least privilege principle — service principals and roles only get minimum required permissions"),
      subHeading("4. Overall Governance"),
      bullet("Secrets are NEVER committed to Git"),
      bullet("CI/CD pipelines fetch secrets only at deployment time"),
      bullet("Maintain a secret inventory and regularly audit it"),
      bullet("For highly sensitive data, combine Databricks Secrets + AWS KMS for encryption"),
    ]
  },
  {
    num: 51,
    q: "How would you build a RAG (retrieval-augmented generation) pipeline for internal documents?",
    kw: "chunking, embedding, vector store, Pinecone, hybrid search, reranking, LLM, RAGAS evaluation",
    content: [
      para("Building a production-grade RAG pipeline is an end-to-end data platform problem — not just an LLM wrapper."),
      subHeading("1. Ingestion & Document Processing (Core DE Work)"),
      bullet("Ingest documents from multiple sources: SharePoint, Confluence, S3, Google Drive, internal CMS"),
      bullet("Use Unstructured.io or LlamaParse for parsing PDFs, Word docs, PowerPoint, etc."),
      bullet("Chunking Strategy: Semantic chunking (not fixed-size) — use langchain + RecursiveCharacterTextSplitter with overlap"),
      bullet("Chunk size: 500–800 tokens with 100–200 token overlap"),
      bullet("Add metadata: document_id, section, page_number, last_updated, access_level"),
      subHeading("2. Embedding Generation"),
      bullet("Choose a strong embedding model (text-embedding-3-large, Voyage AI, or BGE)"),
      bullet("Run embedding jobs on Databricks using Spark for parallel processing at scale"),
      bullet("Store embeddings + metadata in a Delta Lake table as the source of truth"),
      subHeading("3. Vector Store"),
      bullet("Primary choice: Pinecone or Weaviate for pure vector search performance"),
      bullet("Alternative: pgvector (PostgreSQL) or Databricks Vector Search if staying within existing ecosystem"),
      bullet("Hybrid setup: Delta Lake as source of truth + Pinecone/pgvector for fast retrieval"),
      subHeading("4. Retrieval Layer"),
      bullet("Implement Hybrid Search (Vector similarity + Keyword search via BM25)"),
      bullet("Add reranking (using Cohere Rerank or bge-reranker) to improve relevance of top-k results"),
      bullet("Metadata filtering (e.g., only documents the user has access to, documents updated after a certain date)"),
      subHeading("5. LLM Call & Response Generation"),
      bullet("Use a strong LLM (Claude 3.5 / GPT-4o) with prompt engineering for context, system instructions, and citation requirements"),
      bullet("Add guardrails (e.g., LlamaGuard) to prevent hallucinations and unsafe outputs"),
      subHeading("6. Where Data Engineering Fits In"),
      bullet("Building reliable, scalable, and observable ingestion pipelines"),
      bullet("Orchestrating the entire flow using Databricks Workflows or Airflow"),
      bullet("Ensuring data lineage, versioning of documents, and incremental updates (only embed changed/new documents)"),
      bullet("Implementing access control and data governance (row-level security on documents)"),
      bullet("Handling backfills, chunk re-embedding, and vector store synchronization"),
    ]
  },
  {
    num: 52,
    q: "How do you evaluate and monitor a data pipeline that feeds an ML model in production?",
    kw: "data drift, PSI, feature distribution, retraining triggers, Evidently AI, MLflow, Great Expectations",
    content: [
      para("Monitoring a data pipeline that feeds an ML model is more complex than traditional analytics pipelines — data quality directly impacts model performance. I focus on three layers:"),
      subHeading("1. Pipeline Health Monitoring"),
      bullet("Standard observability: Job success rate, latency, throughput, error rates, and resource utilization"),
      bullet("Set up alerts for failures, data volume drops/spikes, and schema changes using Databricks alerts, Airflow, or PagerDuty"),
      subHeading("2. Data Quality & Drift Monitoring (Most Critical)"),
      boldPara("Feature Distribution Checks: ", "Track statistical properties (mean, median, std dev, min/max, quantiles) for every feature. Use Great Expectations, PyDeequ, or Evidently AI for daily profile comparisons."),
      boldPara("Data Drift Detection: ", "Statistical Drift — Kolmogorov-Smirnov (KS) test, Jensen-Shannon divergence, or Population Stability Index (PSI). Semantic Drift — monitor embedding drift for text features using cosine similarity. Schema Drift — detect new/missing columns or type changes."),
      subHeading("3. Model Performance Monitoring"),
      bullet("Track key business metrics in real-time or daily (accuracy, precision, recall, F1, AUC)"),
      bullet("Monitor prediction drift vs actual outcomes (when ground truth becomes available)"),
      bullet("Set up shadow models or champion-challenger testing to compare current model with new candidates"),
      subHeading("4. Retraining Triggers"),
      bullet("Data drift exceeding threshold (e.g., PSI > 0.25)"),
      bullet("Model performance degradation (e.g., F1 drops by 5% over 7 days)"),
      bullet("Significant change in data volume or feature distribution"),
      bullet("Time-based triggers (e.g., retrain weekly for fast-changing domains)"),
      subHeading("5. Tools & Implementation"),
      bullet("Evidently AI or WhyLabs for drift monitoring and dashboards"),
      bullet("MLflow for experiment tracking and model registry"),
      bullet("Great Expectations + custom Spark jobs for data validation"),
      bullet("All metrics logged to a central monitoring store (Delta Lake) and visualized in Databricks SQL dashboards"),
      para("Real example: In our printer predictive maintenance model, we noticed a gradual drop in model accuracy. By monitoring feature distributions, we detected that the distribution of 'ink usage' had shifted due to a new firmware version. This triggered an alert, we investigated the upstream pipeline, fixed the data ingestion logic, and retrained the model — preventing potential business impact."),
    ]
  },
];

// Build the document
function filter(items) {
  return items.filter(i => i != null);
}

const allChildren = [];

// Cover page
allChildren.push(
  new Paragraph({
    children: [new TextRun("")],
    spacing: { before: 2880, after: 0 }
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "DATA ENGINEERING", font: "Calibri", size: 64, bold: true, color: BLUE })],
    spacing: { before: 0, after: 160 }
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Scenario-Based Interview Questions", font: "Calibri", size: 48, bold: false, color: DARK })],
    spacing: { before: 0, after: 320 }
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Mid-to-Senior Level Preparation Guide", font: "Calibri", size: 28, color: GRAY_TEXT, italics: true })],
    spacing: { before: 0, after: 160 }
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "52 Complete Questions with Detailed Answers", font: "Calibri", size: 24, color: GRAY_TEXT })],
    spacing: { before: 0, after: 320 }
  }),
  hr(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Covering: Pipeline Design & Optimization • Data Quality • Databricks & Spark • AWS • Delta Lake • Cost Optimization • Stakeholder Management • GenAI Integration", font: "Calibri", size: 20, color: GRAY_TEXT, italics: true })],
    spacing: { before: 160, after: 0 }
  }),
  pageBreak()
);

// TOC
allChildren.push(
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: "Table of Contents", font: "Calibri", size: 36, bold: true, color: HEADING_COLOR })],
    spacing: { before: 0, after: 200 }
  }),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  pageBreak()
);

// Add questions
for (const q of questions) {
  allChildren.push(
    questionHeader(q.num, q.q),
    keywords(q.kw),
    ...filter(q.content),
    spacer(40)
  );
  // Always page break after each question
  allChildren.push(pageBreak());
}

// Remove last page break
allChildren.pop();

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 20 } }
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, font: "Calibri", color: HEADING_COLOR },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 }
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, font: "Calibri", color: TEAL },
        paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 1 }
      },
    ]
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u2022",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 540, hanging: 260 } } }
          },
          {
            level: 1,
            format: LevelFormat.BULLET,
            text: "\u25E6",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 900, hanging: 260 } } }
          }
        ]
      }
    ]
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Data Engineering — Scenario-Based Interview Preparation", font: "Calibri", size: 18, color: GRAY_TEXT }),
              ],
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } }
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Page ", font: "Calibri", size: 18, color: GRAY_TEXT }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 18, color: GRAY_TEXT }),
                new TextRun({ text: " of ", font: "Calibri", size: 18, color: GRAY_TEXT }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Calibri", size: 18, color: GRAY_TEXT }),
              ],
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } }
            })
          ]
        })
      },
      children: allChildren
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  const outPath = path.join(__dirname, 'DE_Scenario_Interview_Guide.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('Done! Written to', outPath);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
