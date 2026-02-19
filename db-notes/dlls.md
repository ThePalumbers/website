-- Oracle DB DDL schema




-- User-related data


CREATE TABLE USERS (
 Id CHAR(22) PRIMARY KEY,
 Name VARCHAR2(32) NOT NULL, -- Note: names are not unique
 RegistrationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE FRIENDSHIPS (
   UserId CHAR(22),
   FriendId CHAR(22),
   PRIMARY KEY (UserId, FriendId),
   FOREIGN KEY (UserId) REFERENCES USERS(Id) ON DELETE CASCADE,
   FOREIGN KEY (FriendId) REFERENCES USERS(Id) ON DELETE CASCADE
);


-- Business-related data


CREATE TABLE BUSINESSES (
 Id CHAR(22) PRIMARY KEY,
 Name VARCHAR2(64) NOT NULL,
 Street VARCHAR2(120), -- Note: data doesn't always contain street information
 City VARCHAR2(64) NOT NULL,
 State VARCHAR2(5) NOT NULL,
 PostalCode VARCHAR2(10), -- Note: data doesn't always contain postal code information
 PositionLatitude NUMBER(10,6), -- Note: data doesn't always contain position information
 PositionLongitude NUMBER(10,6) -- same as above
);


CREATE TABLE TAGS (
 Id CHAR(22) PRIMARY KEY,
 Name VARCHAR2(64) NOT NULL
);


CREATE TABLE CATEGORIES (
 Id CHAR(22) PRIMARY KEY,
 Name VARCHAR2(64) NOT NULL
);


CREATE TABLE BUSINESS_TAGS (
   BusinessId CHAR(22) NOT NULL,
   TagId CHAR(22) NOT NULL,
   PRIMARY KEY (BusinessId, TagId)
);


CREATE TABLE BUSINESS_CATEGORIES (
   BusinessId CHAR(22) NOT NULL,
   CategoryId CHAR(22) NOT NULL,
   PRIMARY KEY (BusinessId, CategoryId)
);


CREATE TABLE BUSINESS_HOURS (
 Id CHAR(22) PRIMARY KEY,
 BusinessId CHAR(22) NOT NULL,
 Weekday NUMBER(1) CHECK (Weekday BETWEEN 0 AND 6), -- Monday=0
  -- The DATE type is used here only to represent TIME.
 -- Therefore, its day should always be '1970-01-01'
 OpeningTime DATE NOT NULL,
 ClosingTime DATE NOT NULL,
  CONSTRAINT CONST_FIXED_TIME_1 CHECK (TRUNC(OpeningTime) = DATE '1970-01-01'),
 CONSTRAINT CONST_FIXED_TIME_2 CHECK (TRUNC(ClosingTime) = DATE '1970-01-01'),


 FOREIGN KEY (BusinessId) REFERENCES BUSINESSES(Id) ON DELETE CASCADE
);


CREATE TABLE CHECKINS (
   Id CHAR(22) PRIMARY KEY,
   BusinessId CHAR(22),
   Timestamp DATE DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (BusinessId) REFERENCES BUSINESSES(Id) ON DELETE CASCADE
);


-- Feedback-related data


CREATE TABLE FEEDBACKS (
 Id CHAR(22) PRIMARY KEY,
 Type VARCHAR2(10) NOT NULL CHECK (Type IN ('review', 'tip')),
 UserId CHAR(22) NOT NULL,
 BusinessId CHAR(22) NOT NULL,
 Rating NUMBER(1) NOT NULL CHECK (Rating BETWEEN 1 AND 5),
 Text VARCHAR2(5000),
 Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (UserId) REFERENCES USERS(Id) ON DELETE CASCADE,
 FOREIGN KEY (BusinessId) REFERENCES BUSINESSES(Id) ON DELETE CASCADE
);


CREATE TABLE REACTION_TYPES (
 Id CHAR(22) PRIMARY KEY,
 Name VARCHAR2(15) NOT NULL
);


CREATE TABLE REACTIONS (
   Id CHAR(22) PRIMARY KEY,
   UserId CHAR(22), -- Note: data doesn't always contain user information
   FeedbackId CHAR(22) NOT NULL,
   ReactionTypeId CHAR(22),  -- Note: data doesn't always contain reaction type information
   FOREIGN KEY (UserId) REFERENCES USERS(Id) ON DELETE CASCADE,
   FOREIGN KEY (FeedbackId) REFERENCES FEEDBACKS(Id) ON DELETE CASCADE,
   FOREIGN KEY (ReactionTypeId) REFERENCES REACTION_TYPES(Id) ON DELETE CASCADE
);


-- Photo-related data


CREATE TABLE LABELS (
 Id CHAR(22) PRIMARY KEY,
 Name VARCHAR2(15) NOT NULL
);


CREATE TABLE PHOTOS (
   Id CHAR(22) PRIMARY KEY,
   UploaderId CHAR(22),  -- Note: data does not contain uploader id
   BusinessId CHAR(22) NOT NULL,
   Data BLOB NOT NULL,
   Description VARCHAR2(140),
   LabelId CHAR(22) NOT NULL,
   FOREIGN KEY (UploaderId) REFERENCES USERS(Id) ON DELETE CASCADE,
   FOREIGN KEY (BusinessId) REFERENCES BUSINESSES(Id) ON DELETE CASCADE,
   FOREIGN KEY (LabelId) REFERENCES LABELS(Id) ON DELETE CASCADE
);
