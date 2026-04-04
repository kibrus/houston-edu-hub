-- Houston Edu Hub Database Schema for supabase
-- This schema defines three tables: colleges, college_metrics, and college_diversity.


-- Table 1: Static school information
CREATE TABLE IF NOT EXISTS colleges (
    college_id            INTEGER PRIMARY KEY,
    college_name          TEXT NOT NULL,
    category              TEXT,
    city                  TEXT,
    state                 TEXT,
    ownership             TEXT,
    predominant_degree    TEXT,
    awards_offered        TEXT,
    latitude              FLOAT,
    longitude             FLOAT,
    specialized_mission   TEXT,
    religious_affiliation TEXT,
    wioa_programs         TEXT,
    size                  TEXT,
    urbanicity            TEXT
);

-- Table 2: Yearly metrics per school
CREATE TABLE IF NOT EXISTS college_metrics (
    id                      SERIAL PRIMARY KEY,
    college_id              INTEGER REFERENCES colleges(college_id),
    year                    INTEGER,
    in_state_tuition        FLOAT,
    out_state_tuition       FLOAT,
    net_annual_cost         FLOAT,
    acceptance_rate         FLOAT,
    graduation_rate         FLOAT,
    retention_rate          FLOAT,
    enrollment              FLOAT,
    fulltime_pct            FLOAT,
    parttime_pct            FLOAT,
    student_faculty_ratio   FLOAT,
    median_earnings         FLOAT,
    pct_earning_more_than_hs FLOAT,
    median_debt             FLOAT,
    monthly_loan_payment    FLOAT,
    loan_default_rate       FLOAT,
    pell_grant_pct          FLOAT,
    federal_aid_pct         FLOAT,
    outcome_graduated_pct   FLOAT,
    outcome_transferred_pct FLOAT,
    outcome_withdrew_pct    FLOAT,
    outcome_enrolled_pct    FLOAT,
    sat_reading_25          FLOAT,
    sat_reading_75          FLOAT,
    sat_math_25             FLOAT,
    sat_math_75             FLOAT,
    act_25                  FLOAT,
    act_75                  FLOAT
);

-- Table 3: Race and diversity per school per year
CREATE TABLE IF NOT EXISTS college_diversity (
    id                          SERIAL PRIMARY KEY,
    college_id                  INTEGER REFERENCES colleges(college_id),
    year                        INTEGER,
    hispanic_student_pct        FLOAT,
    black_student_pct           FLOAT,
    white_student_pct           FLOAT,
    asian_student_pct           FLOAT,
    nativeamerican_student_pct  FLOAT,
    pacificislander_student_pct FLOAT,
    twoplus_student_pct         FLOAT,
    nonresident_student_pct     FLOAT,
    unknown_student_pct         FLOAT,
    hispanic_staff_pct          FLOAT,
    black_staff_pct             FLOAT,
    white_staff_pct             FLOAT,
    asian_staff_pct             FLOAT,
    nativeamerican_staff_pct    FLOAT,
    pacificislander_staff_pct   FLOAT,
    twoplus_staff_pct           FLOAT,
    nonresident_staff_pct       FLOAT,
    unknown_staff_pct           FLOAT
);