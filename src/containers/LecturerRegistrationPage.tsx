import React from "react";
import styled from "styled-components";
// import components
import Table from "../components/common/Table";
import { Skeleton } from "@material-ui/core";
import Button from "../components/common/Button";
import useFetchTeachingsByOpenRegistrationAndUser from "../hooks/teaching/useGetTeachingsByRegistrationAndUser";
import { Column } from "react-table";
import RegistrationStatus from "../components/common/RegistrationStatus";
import { ReactComponent as NothingImage } from "../assets/images/nothing.svg";
import AddIcon from "@material-ui/icons/Add";

// import models
import { Teaching, Course } from "../react-app-env";

// import hooks
import { useAppSelector } from "../store";
import useGetAllCourses from "../hooks/course/useGetAllCourses";


// Table type
type TeachingTable = {
  courseId: string;
  courseName: string;
  group: number;
  period: string;
  credit: number;
  numOfStudents: number;
};

// prepare data for the table
const prepareData = (
  teachings: Teaching[],
  courses: Course[]
): {
  data: TeachingTable[];
} => {
  let data: TeachingTable[];

  if (teachings.length > 0) {
    data = teachings.map((teaching) => {
      return {
        courseId: teaching.course,
        courseName: courses.find((c) => c._id === teaching.course)!
          .courseName,
        group: teaching.group,
        period: `${teaching.startPeriod} - ${teaching.endPeriod}`,
        credit: courses.find((c) => c._id === teaching.course)!
          .numberOfCredits,
        numOfStudents: teaching.numberOfStudents,
      };
    });
  } else {
    data = [];
  }

  return { data };
};

const LecturerRegistrationPage = () => {
  // state

  // call hooks
  const semesterStatus = useAppSelector(
    (state) => state.semesters.status
  );

  const openRegistration = useAppSelector((state) =>
    state.registrations.registrations.find(
      (reg) => reg.isOpening === true
    )
  );
  const registrationStatus = useAppSelector(
    (state) => state.registrations.status
  );
  const verifiedUser = useAppSelector(
    (state) => state.auth.verifiedUser
  );
  const [
    teachings,
    teachingStatus,
  ] = useFetchTeachingsByOpenRegistrationAndUser(
    openRegistration,
    verifiedUser
  );
  const [courses, courseStatus] = useGetAllCourses();

  // conditional renderer
  const renderTable = () => {
    const columns: Array<Column<TeachingTable>> = [
      {
        Header: "Course ID",
        accessor: "courseId" as const,
      },
      {
        Header: "Course Name",
        accessor: "courseName" as const,
      },
      {
        Header: "Group",
        accessor: "group" as const,
      },
      {
        Header: "Period",
        accessor: "period" as const,
      },
      {
        Header: "Credits",
        accessor: "credit" as const,
      },
      {
        Header: "Number of students",
        accessor: "numOfStudents" as const,
      },
    ];

    if (courseStatus === "succeeded") {
      const { data } = prepareData(
        teachings as Teaching[],
        courses as Course[]
      );
      if (teachingStatus === "succeeded") {
        return (
          <Table<TeachingTable>
            data={data}
            columns={columns}
            name="Teaching"
          />
        );
      } else if (teachingStatus === "failed") {
        const data: TeachingTable[] = [];
        return (
          <Table<TeachingTable>
            data={data}
            columns={columns}
            name="Teaching"
          />
        );
      } else {
        return (
          <SkeletonContainer>
            <Skeleton
              variant="rectangular"
              height={40}
              animation="wave"
            />
            <Skeleton
              variant="rectangular"
              height={40}
              animation="wave"
            />
            <Skeleton
              variant="rectangular"
              height={40}
              animation="wave"
            />
            <Skeleton
              variant="rectangular"
              height={40}
              animation="wave"
            />
          </SkeletonContainer>
        );
      }
    } else if (courseStatus === "failed") {
      const data: TeachingTable[] = [];
      return (
        <Table<TeachingTable>
          data={data}
          columns={columns}
          name="Teaching"
        />
      );
    } else {
      return (
        <SkeletonContainer>
          <Skeleton
            variant="rectangular"
            height={40}
            animation="wave"
          />
          <Skeleton
            variant="rectangular"
            height={40}
            animation="wave"
          />
          <Skeleton
            variant="rectangular"
            height={40}
            animation="wave"
          />
          <Skeleton
            variant="rectangular"
            height={40}
            animation="wave"
          />
        </SkeletonContainer>
      );
    }
  };

  const renderContent = () => {
    if (semesterStatus === "succeeded") {
      if (registrationStatus === "pending") {
        return (
          <Skeleton
            variant="rectangular"
            animation="wave"
            width={250}
          />
        );
      }
      if (registrationStatus === "failed") {
        return (
          <NotFoundContainer>
            <NothingImage />
            <span>There is no registration</span>
          </NotFoundContainer>
        );
      }
      if (registrationStatus === "succeeded") {
        if (openRegistration) {
          return (
            <>
              <Toolbar>
                <Filter>
                  <RegistrationText>
                    Registration batch {openRegistration.batch}
                  </RegistrationText>
                  <RegistrationDuration>
                    (
                    {new Date(
                      openRegistration.startDate
                    ).toDateString()}{" "}
                    -{" "}
                    {new Date(
                      openRegistration.endDate
                    ).toDateString()}
                    )
                  </RegistrationDuration>
                </Filter>
                <Action>
                  <Button icon={<AddIcon />}>New teaching</Button>
                </Action>
              </Toolbar>
              <RegistrationStatus registration={openRegistration} />

              <TableContainer>{renderTable()}</TableContainer>
            </>
          );
        } else {
          return (
            <NotFoundContainer>
              <NothingImage />
              <span>There is no opening registration yet</span>
            </NotFoundContainer>
          );
        }
      }
    } else if (semesterStatus === "failed") {
      return (
        <NotFoundContainer>
          <NothingImage />
          <span>There is no semester</span>
        </NotFoundContainer>
      );
    }
  };

  return (
    <>
      <StyledRegistrationPage>
        {renderContent()}
      </StyledRegistrationPage>
    </>
  );
};

// Styling
const StyledRegistrationPage = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const SkeletonContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  grid-row-gap: 1rem;
`;

const TableContainer = styled.div`
  padding-top: 1rem;
  height: 100%;
  width: 100%;
  overflow: hidden;
`;

const Toolbar = styled.div`
  padding-top: 1rem;
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;

  @media (max-width: 600px) {
    display: inline-flex;
    flex-wrap: wrap;
    & > div {
      margin-bottom: 6px;
    }
  }
`;

const Filter = styled.div`
  display: flex;
  align-items: flex-end;
`;

const RegistrationDuration = styled.span`
  font-size: 14px;
  margin-left: 7px;
`;

const RegistrationText = styled.div`
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  margin-right: 7px;
`;

const Action = styled.div`
  display: grid;
  column-gap: 1rem;
  grid-template-columns: 1fr;
  font-size: 0.875rem;
  margin-left: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    row-gap: 0.5rem;
    width: 100%;
    margin: 0;

    button {
      width: 100%;
    }
  }
`;

const NotFoundContainer = styled.div`
  display: flex;
  justify-content: start;
  align-items: center;
  height: 100%;
  flex-direction: column;
  svg {
    max-width: 550px;
    height: auto;
  }

  span {
    font-weight: 500;
    font-size: 25px;
    margin-top: 1rem;
  }

  button {
    margin-top: 1rem;
  }

  @media (max-width: 600px) {
    svg {
      max-width: 300px;
      height: auto;
    }
  }
`;

export default LecturerRegistrationPage;