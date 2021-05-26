import React, { ChangeEvent, FormEvent, useState } from "react";
import styled from "styled-components";
import Modal from "../common/Modal";
import { ModalProps } from "../../types/modal";
import { unwrapResult } from "@reduxjs/toolkit";
import Button from "../common/Button";
import * as XLSX from "xlsx";

// import models
import { Course, COURSE_TYPES } from "../../types/model";
// import reducers
import { newCourse } from "../../reducers/courseSlice";
import {
  setShowErrorSnackBar,
  setShowSuccessSnackBar,
  setSnackBarContent,
} from "../../reducers/notificationSlice";
// import hooks
import { useAppDispatch, useAppSelector } from "../../store";

const ImportCourseModal = (props: ModalProps) => {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState("idle");
  const [fileSelected, setFileSelected] = useState<FileList>(null!);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const reader = new FileReader();
    reader.onload = async (e) => {
      const workbook = XLSX.read(e.target!.result, {
        type: "binary",
      });

      let courses: Course[] = [];
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      let data = XLSX.utils.sheet_to_json(sheet);

      const attrs = ["STT", "Mã môn", "Tên môn", "Loại môn", "STC"];

      data.forEach((item, i) => {
        // Convert to teaching model
        let course: Course = {
          _id: "",
          courseName: "",
          type: COURSE_TYPES.THEORY,
          numberOfCredits: 0,
          isHidden: false,
        };
        for (let [key, value] of Object.entries(
          item as { [index: string]: string }
        )) {
          // check if right format
          if (!attrs.find((attr) => attr === key)) {
            dispatch(
              setSnackBarContent(
                "Incorrect format. Please refer template file."
              )
            );
            dispatch(setShowErrorSnackBar(true));
            return;
          }

          let strValue = value as string;

          if (strValue.length === 0) {
            dispatch(
              setSnackBarContent(
                `${key} at row ${i} is missing. This teaching will be skipped`
              )
            );
            dispatch(setShowErrorSnackBar(true));
            continue;
          }

          switch (key.toLowerCase()) {
            case "mã môn":
              course._id = strValue;
              break;
            case "tên môn":
              course.courseName = strValue;
              break;
            case "loại môn":
              course.type =
                strValue.toLowerCase() === "theory" ||
                strValue.toLowerCase() === "lý thuyết"
                  ? COURSE_TYPES.THEORY
                  : COURSE_TYPES.PRACTICAL;
              break;
            case "stc":
              course.numberOfCredits = Number(strValue);
              break;
          }
        }
        courses.push(course);
      });

      console.log(courses);

      //send data to server
      setStatus("pending");
      try {
        for (let course of courses) {
          const actionResult = await dispatch(newCourse(course));
          unwrapResult(actionResult);
        }

        dispatch(setSnackBarContent("All new courses created"));
        dispatch(setShowSuccessSnackBar(true));
      } catch (err) {
        console.log("Failed to create all courses", err);
        if (err.response) {
          dispatch(setSnackBarContent(err.response.data.message));
        } else {
          dispatch(
            setSnackBarContent("Failed to create all courses")
          );
        }
        dispatch(setShowErrorSnackBar(true));
      } finally {
        setStatus("idle");
        props.setShowModal(false);
      }
    };
    reader.readAsBinaryString(fileSelected[0]);
  };

  // handle chose file
  const handleFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    setFileSelected(e.target.files!);
  };

  // conditional renderer
  const renderForm = () => {
    return (
      <>
        <ModalText>Choose excel file</ModalText>
        <ChooseFileContainer>
          <InputFile
            onChange={handleFileSelected}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            type="file"
            id="contained-button-file"
          />
          <label htmlFor="contained-button-file">
            <ChooseFileButton>Choose file</ChooseFileButton>
          </label>
          <FileSelectedName>
            {fileSelected && fileSelected[0].name}
          </FileSelectedName>
        </ChooseFileContainer>
        <SubmitButton
          disabled={status === "pending" || fileSelected === null}
          loading={status === "pending"}
          type="submit"
        >
          Submit
        </SubmitButton>
      </>
    );
  };

  return (
    <Modal {...props}>
      <StyledForm onSubmit={handleSubmit}>{renderForm()}</StyledForm>
    </Modal>
  );
};

// Styling
const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const ModalText = styled.div`
  font-size: 13px;
  margin-bottom: 1rem;
`;

const InputFile = styled.input`
  display: none;
`;

const ChooseFileButton = styled.span`
  background-color: ${({ theme }) => theme.blue};
  box-shadow: ${({ theme }) => theme.blueShadow};
  margin: 0;
  padding: 0 2.5rem;
  min-height: 2.5rem;
  max-height: 40px;
  border-radius: 7px;
  color: white;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  display: inline-flex;
  position: relative;
  font-size: 14px;
  transition: background 0.2s ease 0s, color 0.2s ease 0s;

  &:active {
    background-color: ${({ theme }) => theme.blue};
    transform: scale(0.98);
    &:hover {
      background-color: ${({ theme }) => theme.blue};
    }
  }

  &:hover {
    background-color: ${({ theme }) => theme.lightBlue};
  }

  @media (max-width: 900px) {
    padding: 0 2rem;
  }
`;

const ChooseFileContainer = styled.div`
  white-space: nowrap;
`;

const FileSelectedName = styled.span`
  margin-left: 0.5rem;
`;

const SubmitButton = styled(Button)`
  background-color: ${({ disabled, theme }) =>
    disabled ? theme.grey : theme.veryLightBlue};
  box-shadow: none;
  color: ${({ disabled, theme }) =>
    disabled ? theme.darkGrey : theme.blue};
  font-weight: 500;
  font-size: 18px;
  margin-top: 1rem;
  &:active {
    background-color: ${({ theme }) => theme.veryLightBlue};
    &:hover {
      background-color: ${({ theme }) => theme.veryLightBlue};
    }
  }
  &:hover {
    background-color: ${({ theme }) => theme.veryLightBlue};
  }
`;

export default ImportCourseModal;