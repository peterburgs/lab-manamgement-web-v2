import React, { useState } from "react";
import styled from "styled-components";
import { styled as materialStyled } from "@material-ui/core/styles";
import Modal from "../common/Modal";
import { ModalProps } from "../../../types/modal";
import { useForm, Controller } from "react-hook-form";
import {
  TextField,
  FormControlLabel,
  Checkbox,
} from "@material-ui/core";
import Button from "../common/Button";
import { DateTimePicker } from "@material-ui/lab";
import { unwrapResult } from "@reduxjs/toolkit";
import { CheckboxItem } from "../common/CheckboxList";

// import models
import { Registration } from "../../react-app-env";
// import reducers
import {
  setShowErrorSnackBar,
  setShowSuccessSnackBar,
  setSnackBarContent,
} from "../../reducers/notificationSlice";
import { openRegistration } from "../../reducers/registrationSlice";
import { newRegistrableCourse } from "../../reducers/registrableCourseSlice";
// import hooks
import { useAppDispatch, useAppSelector } from "../../store";

// component props
interface OpenRegistrationModalProps extends ModalProps {
  setShowSelectCourseModal: (a: boolean) => void;
  selectedCourses: CheckboxItem[];
}

const OpenRegistrationModal = (props: OpenRegistrationModalProps) => {
  const { handleSubmit, control } = useForm<Registration>();

  const dispatch = useAppDispatch();
  const courses = useAppSelector((state) => state.courses.courses);
  const registrations = useAppSelector(
    (state) => state.registrations.registrations
  );
  const semester = useAppSelector(
    (state) => state.semesters.semesters[0]
  );
  const [status, setStatus] = useState("idle");
  const [isAllCoursesApplied, setIsAllCoursesApplied] = useState(
    true
  );

  const onSubmit = async (data: Registration) => {
    console.log(props.selectedCourses);
    if (courses.length > 0 && semester) {
      try {
        data.batch = registrations.length + 1;
        data.isOpening = true;
        data.isHidden = false;
        data.semester = semester._id;
        setStatus("pending");
        const actionResult = await dispatch(openRegistration(data));
        const regResult = actionResult.payload?.registration;
        if (regResult) {
          if (isAllCoursesApplied) {
            const registrableCourses = courses.map((course) => {
              return {
                registration: regResult._id,
                course: course._id,
              };
            });
            // TODO: Can be improved?
            for (let i = 0; i < registrableCourses.length; i++) {
              const actionResult = await dispatch(
                newRegistrableCourse(registrableCourses[i])
              );
              unwrapResult(actionResult);
            }
          }
        }
        unwrapResult(actionResult);

        dispatch(
          setSnackBarContent("Open registration successfully")
        );
        dispatch(setShowSuccessSnackBar(true));
      } catch (err) {
        console.log("Failed to open registration", err);
        if (err.response) {
          dispatch(setSnackBarContent(err.response.data.message));
        } else {
          dispatch(setSnackBarContent("Failed to open registration"));
        }
        dispatch(setShowErrorSnackBar(true));
      } finally {
        setStatus("idle");
        props.setShowModal(false);
      }
    }
  };

  return (
    <Modal {...props}>
      <StyledForm onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="startDate"
          control={control}
          rules={{ required: true }}
          defaultValue={new Date()}
          render={(props) => (
            <DateTimePicker
              label="Start date"
              inputFormat="dd/MM/yyyy hh:mm a"
              renderInput={(props) => <StyledTextField {...props} />}
              onChange={(value) => props.onChange(value)}
              value={props.value}
            />
          )}
        />
        <Controller
          name="endDate"
          control={control}
          defaultValue={new Date()}
          rules={{ required: true }}
          render={(props) => (
            <DateTimePicker
              label="End date"
              inputFormat="dd/MM/yyyy hh:mm a"
              renderInput={(props) => <StyledTextField {...props} />}
              onChange={(value) => props.onChange(value)}
              value={props.value}
            />
          )}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={isAllCoursesApplied}
              onChange={(e) => {
                setIsAllCoursesApplied(e.target.checked);
              }}
            />
          }
          label="Apply to all courses"
        />
        {!isAllCoursesApplied && (
          <SelectCourseButton
            onClick={() => props.setShowSelectCourseModal(true)}
            type="button"
          >
            Select course
          </SelectCourseButton>
        )}

        <SubmitButton
          disabled={
            status === "pending" ||
            (isAllCoursesApplied === false &&
              props.selectedCourses.length === 0)
          }
          loading={status === "pending"}
          type="submit"
        >
          Submit
        </SubmitButton>
      </StyledForm>
    </Modal>
  );
};

// Styling
const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
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

const SelectCourseButton = styled(Button)`
  background-color: ${({ theme }) => theme.lightRed};
  box-shadow: none;
  color: ${({ theme }) => theme.red};
  font-weight: 500;
  font-size: 18px;
  margin-top: 1rem;
  &:active {
    background-color: ${({ theme }) => theme.lightRed};
    &:hover {
      background-color: ${({ theme }) => theme.lightRed};
    }
  }
  &:hover {
    background-color: ${({ theme }) => theme.lightRed};
  }
`;

const StyledTextField = materialStyled(TextField)({
  marginBottom: "1rem",
  marginTop: "0.5rem",
});

export default OpenRegistrationModal;
