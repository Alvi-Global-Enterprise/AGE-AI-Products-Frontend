import * as Yup from 'yup'

export const subscribeSchema = Yup.object({
  product: Yup.string().required('Select a product'),
  plan: Yup.string().required('Select a plan'),
  billing_email: Yup.string().trim().email('Enter a valid email').nullable(),
  cardholder_name: Yup.string().trim().required('Cardholder name is required'),
})

/** When paying with a saved card, cardholder name is not required */
export function getSubscribeSchema(useSavedCard) {
  if (useSavedCard) {
    return Yup.object({
      product: Yup.string().required('Select a product'),
      plan: Yup.string().required('Select a plan'),
      billing_email: Yup.string().trim().email('Enter a valid email').nullable(),
      cardholder_name: Yup.string().trim().nullable(),
    })
  }
  return subscribeSchema
}

export const subscribeInitialValues = {
  product: 'duewise',
  plan: 'base',
  billing_email: '',
  cardholder_name: '',
}
